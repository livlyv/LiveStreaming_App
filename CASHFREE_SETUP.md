# Cashfree Payout API Setup Guide

## Overview
This guide explains how to set up Cashfree Payout API integration for processing withdrawals in the Rork live streaming app.

## Prerequisites
1. Cashfree Business Account
2. Payout API access enabled
3. Valid business documents for KYC

## Step 1: Create Cashfree Business Account
1. Visit [Cashfree Business](https://www.cashfree.com/business)
2. Sign up for a business account
3. Complete KYC verification
4. Enable Payout API access

## Step 2: Get API Credentials
1. Login to Cashfree Business Dashboard
2. Navigate to **Developers** → **API Keys**
3. Generate new API keys for Payout API
4. Note down:
   - Client ID
   - Client Secret
   - API Endpoint URLs

## Step 3: Environment Configuration
Add these variables to your `backend/.env` file:

```env
# Cashfree Payout API Configuration
CASHFREE_CLIENT_ID=your_cashfree_client_id
CASHFREE_CLIENT_SECRET=your_cashfree_client_secret

# Environment Configuration
NODE_ENV=development  # Uses gamma (test) API
# NODE_ENV=production   # Uses production API
```

## Step 4: API Endpoints
The system automatically uses the correct endpoint based on NODE_ENV:
- **Development**: `https://payout-gamma.cashfree.com/payout/v1`
- **Production**: `https://payout-api.cashfree.com/payout/v1`

## Step 5: Supported Withdrawal Methods

### 1. Bank Transfer
```javascript
{
  withdrawal_method: 'bank',
  account_details: {
    accountNumber: '1234567890',
    ifscCode: 'SBIN0001234'
  }
}
```

### 2. UPI Transfer
```javascript
{
  withdrawal_method: 'upi',
  account_details: {
    upiId: 'user@upi'
  }
}
```

### 3. PayPal Transfer
```javascript
{
  withdrawal_method: 'paypal',
  account_details: {
    paypalEmail: 'user@paypal.com'
  }
}
```

## Step 6: Testing
1. Set `NODE_ENV=development` for testing
2. Use test beneficiary details
3. Test with small amounts first
4. Verify transaction status in Cashfree dashboard

## Step 7: Production Deployment
1. Set `NODE_ENV=production`
2. Use production API credentials
3. Ensure proper error handling
4. Monitor transaction logs

## API Flow
1. **User requests withdrawal** → Frontend calls `/api/payments/withdraw`
2. **Backend validates** → Checks balance, validates input
3. **Creates transaction** → Records in database
4. **Cashfree API call** → Creates beneficiary and initiates transfer
5. **Update status** → Updates transaction with Cashfree response
6. **Deduct balance** → Reduces user's coin balance

## Error Handling
The system handles various error scenarios:
- Insufficient balance
- Invalid account details
- Cashfree API failures
- Network timeouts
- Invalid withdrawal methods

## Security Considerations
1. **API Keys**: Store securely, never expose in client-side code
2. **Validation**: Validate all input data
3. **Rate Limiting**: Implement rate limiting for withdrawal requests
4. **Logging**: Log all withdrawal attempts for audit
5. **Monitoring**: Monitor failed transactions

## Transaction Status Flow
```
pending → processing → completed/failed
```

## Webhook Integration (Optional)
For real-time status updates, implement Cashfree webhooks:
1. Configure webhook URL in Cashfree dashboard
2. Handle status updates in your backend
3. Update transaction status automatically

## Troubleshooting
Common issues and solutions:

### 1. "Cashfree credentials not configured"
- Check environment variables
- Ensure CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET are set

### 2. "Invalid beneficiary details"
- Verify account number and IFSC code
- Check UPI ID format
- Ensure PayPal email is valid

### 3. "Insufficient balance"
- Check user's coin balance
- Verify minimum withdrawal amount (5000 coins)

### 4. "API rate limit exceeded"
- Implement exponential backoff
- Add request queuing

## Support
- Cashfree API Documentation: [Payout API Docs](https://docs.cashfree.com/docs/payout-api)
- Cashfree Support: support@cashfree.com
- Rork App Support: support@rork.app

## Rate Limits
- Test Environment: 100 requests/minute
- Production Environment: 1000 requests/minute
- Plan accordingly for high-volume applications

## Fees
- Bank Transfer: ₹2 per transaction
- UPI Transfer: ₹1 per transaction
- PayPal Transfer: 2.5% + ₹10 per transaction
- Minimum withdrawal: ₹50 (5000 coins)

## Compliance
- Ensure compliance with RBI guidelines
- Maintain proper KYC records
- Report transactions as required by law
- Implement proper audit trails
