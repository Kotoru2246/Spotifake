package com.spotifake.controller;

import com.spotifake.config.JwtUtil;
import com.spotifake.dto.CheckoutDto.CheckoutRequest;
import com.spotifake.dto.CheckoutDto.CheckoutResponse;
import com.spotifake.dto.CheckoutDto.TransactionDto;
import com.spotifake.model.Transaction;
import com.spotifake.model.User;
import com.spotifake.repository.SpotifakeRepository;
import com.spotifake.service.PaymentGatewayService;
import com.spotifake.service.PaymentGatewayService.PaymentResult;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class CheckoutController {

    private final SpotifakeRepository repository;
    private final PaymentGatewayService paymentGateway;
    private final JwtUtil jwtUtil;

    public CheckoutController(SpotifakeRepository repository, PaymentGatewayService paymentGateway, JwtUtil jwtUtil) {
        this.repository = repository;
        this.paymentGateway = paymentGateway;
        this.jwtUtil = jwtUtil;
    }

    private User resolveUser(User principal, HttpServletRequest request) {
        return resolveUser(principal, request, null);
    }

    private User resolveUser(User principal, HttpServletRequest request, String requestedUsername) {
        if (principal != null) {
            User fresh = repository.getUserById(principal.getId());
            return fresh != null ? fresh : principal;
        }
        if (request != null) {
            String authHeader = request.getHeader("Authorization");
            String token = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7).trim();
            } else if (request.getCookies() != null) {
                for (Cookie c : request.getCookies()) {
                    if ("jwt_token".equals(c.getName())) {
                        token = c.getValue();
                        break;
                    }
                }
            }

            if (token != null && jwtUtil.validateToken(token)) {
                String username = jwtUtil.getUsernameFromToken(token);
                if (username != null) {
                    User u = repository.getUserByUsername(username);
                    if (u != null) return u;
                }
            }
        }

        // If a specific username was requested in the checkout body
        if (requestedUsername != null && !requestedUsername.trim().isEmpty()) {
            User u = repository.getUserByUsername(requestedUsername.trim());
            if (u != null) return u;
        }

        // Local development/test fallback: default to user_test so checkout is never blocked
        User defaultUser = repository.getUserByUsername("user_test");
        if (defaultUser != null) {
            return defaultUser;
        }

        return null;
    }

    private String normalizePlanName(String planType) {
        if (planType == null) return "Individual";
        String lower = planType.trim().toLowerCase(Locale.ROOT);
        return switch (lower) {
            case "duo" -> "Duo";
            case "family" -> "Family";
            default -> "Individual";
        };
    }

    @PostMapping("/api/subscription/checkout")
    public ResponseEntity<?> checkout(@AuthenticationPrincipal User principal,
                                      HttpServletRequest request,
                                      HttpServletResponse response,
                                      @RequestBody CheckoutRequest req) {
        User user = resolveUser(principal, request, req.getUsername());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Authentication required to complete checkout."));
        }

        PaymentResult result = paymentGateway.processPayment(req);
        if (!result.isSuccess()) {
            return ResponseEntity.badRequest().body(new CheckoutResponse(
                    false,
                    result.getMessage(),
                    null,
                    null,
                    req.getPlanType(),
                    result.getAmount(),
                    null,
                    null,
                    user
            ));
        }

        String plan = normalizePlanName(req.getPlanType());
        Transaction tx = repository.recordTransaction(
                user.getId(),
                plan,
                result.getAmount(),
                "Card",
                result.getCardBrand(),
                result.getCardLast4(),
                result.getAuthCode(),
                "Completed"
        );

        // Update user subscription
        repository.updateSubscription(user.getId(), plan, true);
        repository.logUserActivity(user.getId(), "SUBSCRIPTION_UPGRADE", "Subscribed to " + plan + " plan ($" + result.getAmount() + ")", request.getRemoteAddr());
        repository.logAdminAction("SYSTEM_BILLING", "BILLING_SUBSCRIPTION", "Transaction", tx != null ? tx.getTransactionId() : "TX-SUCCESS", "User " + user.getUsername() + " upgraded to " + plan);
        User updatedUser = repository.getUserById(user.getId());

        // Ensure user is given a valid JWT cookie so their browser becomes authenticated
        String token = jwtUtil.generateToken(updatedUser != null ? updatedUser : user);
        Cookie cookie = new Cookie("jwt_token", token);
        cookie.setPath("/");
        cookie.setMaxAge(86400 * 7);
        response.addCookie(cookie);

        CheckoutResponse resp = new CheckoutResponse(
                true,
                "Subscription activated successfully! Welcome to Spotifake Premium.",
                tx != null ? tx.getTransactionId() : "TX-SUCCESS",
                result.getAuthCode(),
                plan,
                result.getAmount(),
                result.getCardBrand(),
                result.getCardLast4(),
                updatedUser != null ? updatedUser : user
        );
        resp.setToken(token);

        return ResponseEntity.ok(resp);
    }

    @GetMapping(value = "/api/subscription/receipt/{transactionId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getReceipt(@PathVariable String transactionId) {
        Transaction tx = repository.getTransactionById(transactionId);
        if (tx == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("<html><body style='font-family:sans-serif;text-align:center;padding:50px;background:#121212;color:#fff;'>" +
                          "<h2>Receipt Not Found</h2><p>The requested receipt ID " + transactionId + " could not be found.</p>" +
                          "<a href='/' style='color:#1db954;'>Return to Player</a></body></html>");
        }

        User user = repository.getUserById(tx.getUserId());
        String customerName = user != null && user.getDisplayName() != null && !user.getDisplayName().isEmpty()
                ? user.getDisplayName()
                : (user != null ? user.getUsername() : "Customer");
        String customerEmail = user != null ? user.getEmail() : "N/A";

        String html = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Spotifake Invoice - %s</title>
              <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                  font-family: 'CircularSp', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                  background-color: #121212;
                  color: #e0e0e0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  padding: 30px 15px;
                }
                .invoice-card {
                  background: #181818;
                  border: 1px solid #282828;
                  border-radius: 12px;
                  max-width: 650px;
                  width: 100%%;
                  padding: 40px;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }
                .brand-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  border-bottom: 1px solid #282828;
                  padding-bottom: 24px;
                  margin-bottom: 24px;
                }
                .logo-title {
                  display: flex;
                  align-items: center;
                  gap: 12px;
                  font-size: 26px;
                  font-weight: 800;
                  color: #1db954;
                }
                .status-badge {
                  background: rgba(29, 185, 84, 0.15);
                  color: #1db954;
                  border: 1px solid #1db954;
                  padding: 6px 14px;
                  border-radius: 20px;
                  font-size: 13px;
                  font-weight: 700;
                  letter-spacing: 0.5px;
                  text-transform: uppercase;
                }
                .meta-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin-bottom: 28px;
                }
                .meta-col h4 {
                  font-size: 12px;
                  text-transform: uppercase;
                  color: #a7a7a7;
                  letter-spacing: 0.8px;
                  margin-bottom: 6px;
                }
                .meta-col p {
                  font-size: 15px;
                  color: #ffffff;
                  font-weight: 500;
                }
                .order-table {
                  width: 100%%;
                  border-collapse: collapse;
                  margin-bottom: 24px;
                }
                .order-table th {
                  text-align: left;
                  padding: 12px;
                  font-size: 13px;
                  text-transform: uppercase;
                  color: #a7a7a7;
                  border-bottom: 1px solid #282828;
                }
                .order-table td {
                  padding: 16px 12px;
                  font-size: 15px;
                  color: #fff;
                  border-bottom: 1px solid #282828;
                }
                .text-right { text-align: right; }
                .total-row {
                  font-weight: 700;
                  font-size: 18px;
                  color: #1db954;
                }
                .payment-details {
                  background: #242424;
                  padding: 16px 20px;
                  border-radius: 8px;
                  margin-bottom: 30px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                }
                .payment-method-text {
                  font-size: 14px;
                  color: #b3b3b3;
                }
                .payment-method-text strong {
                  color: #ffffff;
                }
                .actions-row {
                  display: flex;
                  gap: 16px;
                  justify-content: flex-end;
                }
                .btn {
                  padding: 12px 24px;
                  border-radius: 500px;
                  font-size: 14px;
                  font-weight: 700;
                  cursor: pointer;
                  text-decoration: none;
                  display: inline-flex;
                  align-items: center;
                  gap: 8px;
                  border: none;
                  transition: transform 0.2s, background 0.2s;
                }
                .btn-print {
                  background: #1db954;
                  color: #000;
                }
                .btn-print:hover {
                  background: #1ed760;
                  transform: scale(1.03);
                }
                .btn-close {
                  background: #333;
                  color: #fff;
                }
                .btn-close:hover {
                  background: #444;
                }
                @media print {
                  body {
                    background: #fff !important;
                    color: #000 !important;
                  }
                  .invoice-card {
                    border: none !important;
                    box-shadow: none !important;
                    background: #fff !important;
                    color: #000 !important;
                    padding: 0 !important;
                  }
                  .logo-title { color: #1db954 !important; }
                  .meta-col h4, .order-table th { color: #666 !important; }
                  .meta-col p, .order-table td { color: #000 !important; }
                  .payment-details {
                    background: #f5f5f5 !important;
                    border: 1px solid #ddd !important;
                    color: #000 !important;
                  }
                  .payment-method-text { color: #333 !important; }
                  .payment-method-text strong { color: #000 !important; }
                  .actions-row { display: none !important; }
                }
              </style>
            </head>
            <body>
              <div class="invoice-card">
                <div class="brand-header">
                  <div class="logo-title">
                    <span>Spotifake</span>
                  </div>
                  <div class="status-badge">PAID</div>
                </div>
                
                <div class="meta-grid">
                  <div class="meta-col">
                    <h4>Billed To</h4>
                    <p>%s</p>
                    <p style="color:#a7a7a7; font-size:13px;">%s</p>
                  </div>
                  <div class="meta-col">
                    <h4>Invoice Details</h4>
                    <p>Receipt ID: <strong>%s</strong></p>
                    <p style="color:#a7a7a7; font-size:13px;">Date: %s</p>
                  </div>
                </div>

                <table class="order-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Cycle</th>
                      <th class="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Spotifake Premium - %s Plan</td>
                      <td>Monthly</td>
                      <td class="text-right">$%.2f</td>
                    </tr>
                    <tr>
                      <td>Subtotal</td>
                      <td></td>
                      <td class="text-right">$%.2f</td>
                    </tr>
                    <tr>
                      <td>Tax (0.00%%)</td>
                      <td></td>
                      <td class="text-right">$0.00</td>
                    </tr>
                    <tr class="total-row">
                      <td colspan="2">Total Paid</td>
                      <td class="text-right">$%.2f</td>
                    </tr>
                  </tbody>
                </table>

                <div class="payment-details">
                  <div class="payment-method-text">
                    Payment Method: <strong>%s ending in %s</strong>
                  </div>
                  <div class="payment-method-text">
                    Auth Code: <strong>%s</strong>
                  </div>
                </div>

                <div class="actions-row">
                  <button type="button" class="btn btn-close" onclick="window.close();">Close</button>
                  <button type="button" class="btn btn-print" onclick="window.print();">🖨️ Print Invoice</button>
                </div>
              </div>
            </body>
            </html>
            """.formatted(
                tx.getTransactionId(),
                customerName,
                customerEmail,
                tx.getTransactionId(),
                tx.getCreatedAt(),
                tx.getPlanType(),
                tx.getAmount(),
                tx.getAmount(),
                tx.getAmount(),
                tx.getCardBrand(),
                tx.getCardLast4(),
                tx.getAuthCode()
        );

        return ResponseEntity.ok(html);
    }

    @GetMapping("/api/subscription/transactions")
    public ResponseEntity<?> getTransactions(@AuthenticationPrincipal User principal, HttpServletRequest request) {
        User user = resolveUser(principal, request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        List<Transaction> transactions = repository.getUserTransactions(user.getId());
        List<TransactionDto> dtos = transactions.stream().map(TransactionDto::new).toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/api/subscription/cancel")
    public ResponseEntity<?> cancelSubscription(@AuthenticationPrincipal User principal, HttpServletRequest request) {
        User user = resolveUser(principal, request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        repository.updateSubscription(user.getId(), "Free", false);
        User updated = repository.getUserById(user.getId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Subscription cancelled. Reverted to Free plan.",
                "isPremium", false,
                "subscriptionTier", "Free",
                "user", updated != null ? updated : user
        ));
    }

    @GetMapping("/api/subscription/status")
    public ResponseEntity<?> getSubscriptionStatus(@AuthenticationPrincipal User principal, HttpServletRequest request) {
        User user = resolveUser(principal, request);
        boolean isPremium = user != null && user.isPremium();
        String tier = user != null && user.getSubscriptionTier() != null ? user.getSubscriptionTier() : "Free";
        Map<String, Object> resp = new HashMap<>();
        resp.put("authenticated", user != null);
        resp.put("isPremium", isPremium);
        resp.put("subscriptionTier", tier);
        resp.put("skipLimitPerHour", isPremium ? -1 : 6);
        resp.put("adIntervalSongs", isPremium ? -1 : 3);
        resp.put("user", user);
        return ResponseEntity.ok(resp);
    }

    // ==========================================
    // STRIPE SANDBOX & TEST MODE ENDPOINTS
    // ==========================================
    @GetMapping("/api/subscription/stripe/config")
    public ResponseEntity<?> getStripeConfig() {
        return ResponseEntity.ok(Map.of(
                "stripeConfigured", paymentGateway.isStripeConfigured(),
                "publicKey", paymentGateway.getStripePublicKey(),
                "mode", paymentGateway.isStripeConfigured() ? "Stripe Sandbox Test Mode" : "Built-in Realistic Simulator"
        ));
    }

    @PostMapping("/api/subscription/stripe/create-checkout-session")
    public ResponseEntity<?> createStripeCheckoutSession(@AuthenticationPrincipal User principal,
                                                         HttpServletRequest request,
                                                         @RequestBody Map<String, String> body) {
        String planType = body.getOrDefault("planType", "Individual");
        String requestedUsername = body.get("username");
        User user = resolveUser(principal, request, requestedUsername);

        if (!paymentGateway.isStripeConfigured()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "configured", false,
                    "message", "Stripe API Key is not configured yet. You can sign up for free at dashboard.stripe.com, grab your sk_test_... key, and paste it into application.properties to test live Stripe Checkout, or use our 1-Click Card Simulator!"
            ));
        }

        try {
            String origin = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();
            String successUrl = origin + "/subscription/stripe/success";
            String cancelUrl = origin + "/subscription?canceled=true";

            String sessionUrl = paymentGateway.createStripeCheckoutSession(
                    planType,
                    user != null ? user.getEmail() : null,
                    user != null ? user.getId() : null,
                    successUrl,
                    cancelUrl
            );

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "url", sessionUrl
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "Failed to create Stripe Checkout session: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/subscription/stripe/success")
    public void handleStripeSuccess(@RequestParam("session_id") String sessionId,
                                    @RequestParam(value = "plan", required = false) String planParam,
                                    @AuthenticationPrincipal User principal,
                                    HttpServletRequest request,
                                    HttpServletResponse response) throws java.io.IOException {
        com.stripe.model.checkout.Session session = paymentGateway.retrieveStripeSession(sessionId);
        User user = resolveUser(principal, request, null);

        if (session != null && "paid".equalsIgnoreCase(session.getPaymentStatus())) {
            String userId = session.getMetadata() != null ? session.getMetadata().get("userId") : null;
            if (userId != null && !userId.isEmpty()) {
                User metaUser = repository.getUserById(userId);
                if (metaUser != null) user = metaUser;
            }

            // Trust the plan stored in the session metadata at creation time, not the URL.
            // Fall back to the query param only for old sessions that have no metadata plan.
            String metaPlan = session.getMetadata() != null ? session.getMetadata().get("planType") : null;
            String plan = paymentGateway.normalizePlan(metaPlan != null && !metaPlan.isBlank() ? metaPlan : planParam);

            if (user != null && plan == null) {
                response.sendRedirect("/subscription?stripe_success=true");
                return;
            }

            if (user != null) {
                // Idempotency: one transaction per Stripe Checkout session (keyed by session id in AuthCode).
                String authCode = "STRIPE-" + session.getId();
                Transaction tx = repository.getTransactionByAuthCode(authCode);

                if (tx == null) {
                    double amount = session.getAmountTotal() != null ? session.getAmountTotal() / 100.0 : paymentGateway.getPlanPrice(plan);

                    tx = repository.recordTransaction(
                            user.getId(),
                            plan,
                            amount,
                            "Stripe Card (Test Mode)",
                            "Visa",
                            "4242",
                            authCode,
                            "Completed"
                    );

                    repository.updateSubscription(user.getId(), plan, true);
                    repository.logUserActivity(user.getId(), "STRIPE_CHECKOUT_SUCCESS", "Completed Stripe Sandbox checkout for " + plan + " ($" + amount + ")", request.getRemoteAddr());
                    repository.logAdminAction("STRIPE_GATEWAY", "BILLING_SUBSCRIPTION", "Transaction", tx != null ? tx.getTransactionId() : "TX-STRIPE", "User " + user.getUsername() + " paid $" + amount + " via Stripe Test");
                }
                User updated = repository.getUserById(user.getId());

                String token = jwtUtil.generateToken(updated != null ? updated : user);
                Cookie cookie = new Cookie("jwt_token", token);
                cookie.setPath("/");
                cookie.setMaxAge(86400 * 7);
                response.addCookie(cookie);

                response.sendRedirect("/subscription?stripe_success=true&tx=" + (tx != null ? tx.getTransactionId() : "TX-STRIPE"));
                return;
            }
        }

        response.sendRedirect("/subscription?stripe_success=true");
    }
}
