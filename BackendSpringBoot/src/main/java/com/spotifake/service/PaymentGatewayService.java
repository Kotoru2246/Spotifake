package com.spotifake.service;

import com.spotifake.dto.CheckoutDto.CheckoutRequest;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.Random;

@Service
public class PaymentGatewayService {

    @Value("${stripe.api.key:}")
    private String stripeApiKey;

    @Value("${stripe.public.key:}")
    private String stripePublicKey;

    public static class PaymentResult {
        private final boolean success;
        private final String message;
        private final String authCode;
        private final String cardBrand;
        private final String cardLast4;
        private final double amount;

        public PaymentResult(boolean success, String message, String authCode, String cardBrand, String cardLast4, double amount) {
            this.success = success;
            this.message = message;
            this.authCode = authCode;
            this.cardBrand = cardBrand;
            this.cardLast4 = cardLast4;
            this.amount = amount;
        }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public String getAuthCode() { return authCode; }
        public String getCardBrand() { return cardBrand; }
        public String getCardLast4() { return cardLast4; }
        public double getAmount() { return amount; }

        public static PaymentResult failure(String message) {
            return new PaymentResult(false, message, null, null, null, 0.0);
        }

        public static PaymentResult success(String authCode, String cardBrand, String cardLast4, double amount) {
            return new PaymentResult(true, "Approved", authCode, cardBrand, cardLast4, amount);
        }
    }

    public PaymentResult processPayment(CheckoutRequest req) {
        if (req == null) {
            return PaymentResult.failure("Invalid payment request.");
        }

        if (req.getCardholderName() == null || req.getCardholderName().trim().isEmpty()) {
            return PaymentResult.failure("Cardholder name is required.");
        }

        String rawCard = req.getCardNumber();
        if (rawCard == null) {
            return PaymentResult.failure("Card number is required.");
        }
        String cleanCard = rawCard.replaceAll("[\\s-]+", "");
        if (!cleanCard.matches("^\\d{13,19}$")) {
            return PaymentResult.failure("Invalid card number format. Must be between 13 and 19 digits.");
        }

        // Bank authorization simulation for test decline scenarios
        if (cleanCard.endsWith("0002")) {
            return PaymentResult.failure("Card declined: Insufficient funds");
        }
        if (cleanCard.endsWith("0003")) {
            return PaymentResult.failure("Card declined: Card expired");
        }
        if (cleanCard.endsWith("0004")) {
            return PaymentResult.failure("Card declined: Suspected fraud / contact issuing bank");
        }

        // Luhn checksum validation
        if (!isValidLuhn(cleanCard)) {
            return PaymentResult.failure("Invalid card number: Luhn check failed.");
        }

        // Expiration validation
        String rawExpiry = req.getExpiryDate();
        if (rawExpiry == null || !rawExpiry.matches("^(0[1-9]|1[0-2])\\/(\\d{2}|\\d{4})$")) {
            return PaymentResult.failure("Invalid expiration date format. Expected MM/YY.");
        }
        if (isExpired(rawExpiry)) {
            return PaymentResult.failure("Card declined: Card has expired.");
        }

        // CVC validation
        String cvc = req.getCvc();
        if (cvc == null || !cvc.matches("^\\d{3,4}$")) {
            return PaymentResult.failure("Invalid security code (CVC). Must be 3 or 4 digits.");
        }

        // Detect Card Brand
        String brand = detectCardBrand(cleanCard);

        // Card Last 4
        String last4 = cleanCard.substring(cleanCard.length() - 4);

        // Pricing lookup
        double amount = getPlanPrice(req.getPlanType());
        if (amount <= 0) {
            return PaymentResult.failure("Invalid plan selected: " + req.getPlanType());
        }

        // Generate Auth Code
        String authCode = generateAuthCode();

        return PaymentResult.success(authCode, brand, last4, amount);
    }

    public boolean isValidLuhn(String cardNumber) {
        int sum = 0;
        boolean alternate = false;
        for (int i = cardNumber.length() - 1; i >= 0; i--) {
            int n = Integer.parseInt(cardNumber.substring(i, i + 1));
            if (alternate) {
                n *= 2;
                if (n > 9) {
                    n = (n % 10) + 1;
                }
            }
            sum += n;
            alternate = !alternate;
        }
        return (sum % 10 == 0);
    }

    public String detectCardBrand(String cardNumber) {
        if (cardNumber == null || cardNumber.isEmpty()) return "Card";
        if (cardNumber.startsWith("4")) {
            return "Visa";
        }
        if (cardNumber.matches("^(5[1-5]|222[1-9]|22[3-9]\\d|2[3-6]\\d{2}|27[01]\\d|2720).*")) {
            return "Mastercard";
        }
        if (cardNumber.startsWith("34") || cardNumber.startsWith("37")) {
            return "Amex";
        }
        if (cardNumber.startsWith("6011") || cardNumber.startsWith("65") || cardNumber.matches("^64[4-9].*")) {
            return "Discover";
        }
        return "Card";
    }

    private boolean isExpired(String expiryDate) {
        try {
            String[] parts = expiryDate.split("/");
            int month = Integer.parseInt(parts[0]);
            int year = Integer.parseInt(parts[1]);
            if (year < 100) {
                year += 2000;
            }
            YearMonth expYearMonth = YearMonth.of(year, month);
            YearMonth currentYearMonth = YearMonth.now();
            return expYearMonth.isBefore(currentYearMonth);
        } catch (Exception e) {
            return true;
        }
    }

    public double getPlanPrice(String planType) {
        if (planType == null) return 4.99;
        String plan = planType.trim().toLowerCase(Locale.ROOT);
        return switch (plan) {
            case "duo" -> 6.99;
            case "family" -> 9.99;
            default -> 4.99; // Individual
        };
    }

    /** Returns the canonical plan name (Individual/Duo/Family) or null if the plan is unknown. */
    public String normalizePlan(String planType) {
        if (planType == null) return null;
        return switch (planType.trim().toLowerCase(Locale.ROOT)) {
            case "individual" -> "Individual";
            case "duo" -> "Duo";
            case "family" -> "Family";
            default -> null;
        };
    }

    private String generateAuthCode() {
        String chars = "0123456789ABCDEF";
        StringBuilder sb = new StringBuilder("AUTH-");
        Random random = new Random();
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    public boolean isStripeConfigured() {
        if (stripeApiKey == null) return false;
        String key = stripeApiKey.trim();
        return key.startsWith("sk_") && !key.toLowerCase().contains("placeholder") && key.length() > 25;
    }

    public String getStripePublicKey() {
        return stripePublicKey != null ? stripePublicKey.trim() : "";
    }

    public String createStripeCheckoutSession(String planType, String customerEmail, String userId, String successUrl, String cancelUrl) throws StripeException {
        if (!isStripeConfigured()) {
            throw new IllegalStateException("Stripe secret key is not configured. Add stripe.api.key=sk_test_... in application.properties to test live Stripe checkout.");
        }

        Stripe.apiKey = stripeApiKey.trim();

        String canonicalPlan = normalizePlan(planType);
        if (canonicalPlan == null) {
            throw new IllegalArgumentException("Unknown plan: " + planType);
        }
        planType = canonicalPlan;

        double price = getPlanPrice(planType);
        long amountInCents = Math.round(price * 100);

        SessionCreateParams.Builder builder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl + "?session_id={CHECKOUT_SESSION_ID}&plan=" + planType)
                .setCancelUrl(cancelUrl)
                .putMetadata("userId", userId != null ? userId : "")
                .putMetadata("planType", planType)
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("usd")
                                                .setUnitAmount(amountInCents)
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName("Spotifake Premium - " + planType + " Plan")
                                                                .setDescription("Spotifake ad-free listening, unlimited skips, offline downloads & synced lyrics.")
                                                                .build()
                                                )
                                                .build()
                                )
                                .build()
                );

        if (customerEmail != null && !customerEmail.trim().isEmpty()) {
            builder.setCustomerEmail(customerEmail.trim());
        }

        Session session = Session.create(builder.build());
        return session.getUrl();
    }

    public Session retrieveStripeSession(String sessionId) {
        if (!isStripeConfigured() || sessionId == null || sessionId.trim().isEmpty()) {
            return null;
        }
        try {
            Stripe.apiKey = stripeApiKey.trim();
            return Session.retrieve(sessionId.trim());
        } catch (Exception e) {
            System.err.println("Failed to retrieve Stripe session: " + e.getMessage());
            return null;
        }
    }
}
