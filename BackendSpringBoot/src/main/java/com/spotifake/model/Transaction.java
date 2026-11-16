package com.spotifake.model;

public class Transaction {
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

    public Transaction() {}

    public Transaction(String transactionId, String userId, String planType, double amount, 
                       String currency, String paymentMethod, String cardBrand, String cardLast4, 
                       String authCode, String status, String createdAt) {
        this.transactionId = transactionId;
        this.userId = userId;
        this.planType = planType;
        this.amount = amount;
        this.currency = currency;
        this.paymentMethod = paymentMethod;
        this.cardBrand = cardBrand;
        this.cardLast4 = cardLast4;
        this.authCode = authCode;
        this.status = status;
        this.createdAt = createdAt;
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
