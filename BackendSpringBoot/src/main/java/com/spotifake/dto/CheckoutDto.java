package com.spotifake.dto;

import com.spotifake.model.Transaction;
import com.spotifake.model.User;

public class CheckoutDto {

    public static class CheckoutRequest {
        private String planType;
        private String cardholderName;
        private String cardNumber;
        private String expiryDate;
        private String cvc;
        private String billingZip;
        private String username;

        public CheckoutRequest() {}

        public CheckoutRequest(String planType, String cardholderName, String cardNumber, String expiryDate, String cvc, String billingZip) {
            this.planType = planType;
            this.cardholderName = cardholderName;
            this.cardNumber = cardNumber;
            this.expiryDate = expiryDate;
            this.cvc = cvc;
            this.billingZip = billingZip;
        }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getPlanType() { return planType; }
        public void setPlanType(String planType) { this.planType = planType; }

        public String getCardholderName() { return cardholderName; }
        public void setCardholderName(String cardholderName) { this.cardholderName = cardholderName; }

        public String getCardNumber() { return cardNumber; }
        public void setCardNumber(String cardNumber) { this.cardNumber = cardNumber; }

        public String getExpiryDate() { return expiryDate; }
        public void setExpiryDate(String expiryDate) { this.expiryDate = expiryDate; }

        public String getCvc() { return cvc; }
        public void setCvc(String cvc) { this.cvc = cvc; }

        public String getBillingZip() { return billingZip; }
        public void setBillingZip(String billingZip) { this.billingZip = billingZip; }
    }

    public static class CheckoutResponse {
        private boolean success;
        private String message;
        private String transactionId;
        private String authCode;
        private String planType;
        private double amount;
        private String cardBrand;
        private String cardLast4;
        private User user;
        private String token;

        public CheckoutResponse() {}

        public CheckoutResponse(boolean success, String message, String transactionId, String authCode,
                                String planType, double amount, String cardBrand, String cardLast4, User user) {
            this.success = success;
            this.message = message;
            this.transactionId = transactionId;
            this.authCode = authCode;
            this.planType = planType;
            this.amount = amount;
            this.cardBrand = cardBrand;
            this.cardLast4 = cardLast4;
            this.user = user;
        }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public String getTransactionId() { return transactionId; }
        public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

        public String getAuthCode() { return authCode; }
        public void setAuthCode(String authCode) { this.authCode = authCode; }

        public String getPlanType() { return planType; }
        public void setPlanType(String planType) { this.planType = planType; }

        public double getAmount() { return amount; }
        public void setAmount(double amount) { this.amount = amount; }

        public String getCardBrand() { return cardBrand; }
        public void setCardBrand(String cardBrand) { this.cardBrand = cardBrand; }

        public String getCardLast4() { return cardLast4; }
        public void setCardLast4(String cardLast4) { this.cardLast4 = cardLast4; }

        public User getUser() { return user; }
        public void setUser(User user) { this.user = user; }

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
    }

    public static class TransactionDto {
        private String transactionId;
        private String userId;
        private String planType;
        private double amount;
        private String currency;
        private String paymentMethod;
        private String cardBrand;
        private String cardLast4;
        private String authCode;
        private String status;
        private String createdAt;

        public TransactionDto() {}

        public TransactionDto(Transaction t) {
            if (t != null) {
                this.transactionId = t.getTransactionId();
                this.userId = t.getUserId();
                this.planType = t.getPlanType();
                this.amount = t.getAmount();
                this.currency = t.getCurrency();
                this.paymentMethod = t.getPaymentMethod();
                this.cardBrand = t.getCardBrand();
                this.cardLast4 = t.getCardLast4();
                this.authCode = t.getAuthCode();
                this.status = t.getStatus();
                this.createdAt = t.getCreatedAt();
            }
        }

        public String getTransactionId() { return transactionId; }
        public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }

        public String getPlanType() { return planType; }
        public void setPlanType(String planType) { this.planType = planType; }

        public double getAmount() { return amount; }
        public void setAmount(double amount) { this.amount = amount; }

        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }

        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

        public String getCardBrand() { return cardBrand; }
        public void setCardBrand(String cardBrand) { this.cardBrand = cardBrand; }

        public String getCardLast4() { return cardLast4; }
        public void setCardLast4(String cardLast4) { this.cardLast4 = cardLast4; }

        public String getAuthCode() { return authCode; }
        public void setAuthCode(String authCode) { this.authCode = authCode; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    }
}
