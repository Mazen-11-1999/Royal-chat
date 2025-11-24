'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { ArrowLeft, CreditCard, Lock, CheckCircle2, X, Building2 } from 'lucide-react';
import { User } from '@/types/chat';
import { Subscription } from '@/types/subscription';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface PaymentPageProps {
  currentUser: User;
  onSuccess: (subscription: Subscription) => void;
  onCancel: () => void;
}

export function PaymentPage({ currentUser, onSuccess, onCancel }: PaymentPageProps) {
  const { t, dir } = useLanguage();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'bank_transfer'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (paymentMethod === 'card') {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
        newErrors.cardNumber = dir === 'rtl' ? 'رقم البطاقة غير صحيح' : 'Invalid card number';
      }
      if (!cardName) {
        newErrors.cardName = dir === 'rtl' ? 'اسم حامل البطاقة مطلوب' : 'Cardholder name required';
      }
      if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
        newErrors.expiryDate = dir === 'rtl' ? 'تاريخ انتهاء الصلاحية غير صحيح' : 'Invalid expiry date';
      }
      if (!cvv || cvv.length !== 3) {
        newErrors.cvv = dir === 'rtl' ? 'CVV غير صحيح' : 'Invalid CVV';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create subscription
      const subscription: Subscription = {
        id: `sub_${Date.now()}`,
        userId: currentUser.id,
        status: paymentMethod === 'bank_transfer' ? 'pending' : 'active', // Bank transfer requires manual approval
        plan: 'lifetime',
        amount: 30,
        currency: 'USD',
        purchaseDate: new Date(),
        paymentMethod: paymentMethod === 'card' ? 'credit_card' : paymentMethod === 'paypal' ? 'paypal' : 'bank_transfer',
        paymentId: `pay_${Date.now()}`,
        transactionId: `txn_${Date.now()}`
      };

      onSuccess(subscription);
    } catch (error) {
      console.error('Payment error:', error);
      setErrors({ payment: dir === 'rtl' ? 'فشل الدفع. حاول مرة أخرى.' : 'Payment failed. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden" dir={dir}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6">
        <div className="flex items-start justify-center min-h-full py-2 sm:py-4 md:py-6">
          <Card className="w-full max-w-3xl my-auto">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="rounded-full h-10 w-10 sm:h-12 sm:w-12 min-h-[44px] min-w-[44px] touch-manipulation"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl sm:text-2xl md:text-3xl">
                {dir === 'rtl' ? 'إتمام الدفع' : 'Complete Payment'}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base mt-1">
                {dir === 'rtl'
                  ? 'اشترك في الدردشة الجماعية المميزة - $30 مدى الحياة'
                  : 'Subscribe to Premium Group Chat - $30 Lifetime'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 sm:space-y-6 overflow-visible p-4 sm:p-6">
          {/* Payment Summary */}
          <div className="border-2 border-primary/20 rounded-lg p-4 sm:p-5 bg-muted/50">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-sm sm:text-base">{dir === 'rtl' ? 'الاشتراك المميز' : 'Premium Subscription'}</span>
              <span className="text-2xl sm:text-3xl font-bold text-primary">$30</span>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {dir === 'rtl' ? 'دفعة واحدة - اشتراك مدى الحياة' : 'One-time payment - Lifetime access'}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3 sm:space-y-4">
            <Label className="text-sm sm:text-base">{dir === 'rtl' ? 'طريقة الدفع' : 'Payment Method'}</Label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Button
                type="button"
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('card')}
                className={cn(
                  'h-auto py-4 sm:py-5 flex flex-col items-center gap-2 min-h-[80px] sm:min-h-[90px]',
                  paymentMethod === 'card' && 'ring-2 ring-primary',
                  'touch-manipulation'
                )}
              >
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-[10px] sm:text-xs font-medium text-center px-1">{dir === 'rtl' ? 'بطاقة ائتمان' : 'Credit Card'}</span>
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'paypal' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('paypal')}
                className={cn(
                  'h-auto py-4 sm:py-5 flex flex-col items-center gap-2 min-h-[80px] sm:min-h-[90px]',
                  paymentMethod === 'paypal' && 'ring-2 ring-primary',
                  'touch-manipulation'
                )}
              >
                <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-[10px] sm:text-xs font-medium text-center px-1">PayPal</span>
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'bank_transfer' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('bank_transfer')}
                className={cn(
                  'h-auto py-4 sm:py-5 flex flex-col items-center gap-2 min-h-[80px] sm:min-h-[90px]',
                  paymentMethod === 'bank_transfer' && 'ring-2 ring-primary',
                  'touch-manipulation'
                )}
              >
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-[10px] sm:text-xs font-medium text-center px-1">{dir === 'rtl' ? 'تحويل بنكي' : 'Bank Transfer'}</span>
              </Button>
            </div>
          </div>

          {/* Card Payment Form */}
          {paymentMethod === 'card' && (
            <div className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="cardNumber" className="text-sm sm:text-base">{dir === 'rtl' ? 'رقم البطاقة' : 'Card Number'}</Label>
                <Input
                  id="cardNumber"
                  placeholder={dir === 'rtl' ? '1234 5678 9012 3456' : '1234 5678 9012 3456'}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  className={cn(
                    errors.cardNumber ? 'border-red-500' : '',
                    "h-12 sm:h-14 text-base"
                  )}
                  dir="ltr"
                />
                {errors.cardNumber && (
                  <p className="text-xs sm:text-sm text-red-500">{errors.cardNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardName" className="text-sm sm:text-base">{dir === 'rtl' ? 'اسم حامل البطاقة' : 'Cardholder Name'}</Label>
                <Input
                  id="cardName"
                  placeholder={dir === 'rtl' ? 'اسم حامل البطاقة' : 'Cardholder Name'}
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className={cn(
                    errors.cardName ? 'border-red-500' : '',
                    "h-12 sm:h-14 text-base"
                  )}
                  dir={dir}
                />
                {errors.cardName && (
                  <p className="text-xs sm:text-sm text-red-500">{errors.cardName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate" className="text-sm sm:text-base">{dir === 'rtl' ? 'تاريخ الانتهاء' : 'Expiry Date'}</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                    maxLength={5}
                    className={cn(
                      errors.expiryDate ? 'border-red-500' : '',
                      "h-12 sm:h-14 text-base"
                    )}
                    dir="ltr"
                  />
                  {errors.expiryDate && (
                    <p className="text-xs sm:text-sm text-red-500">{errors.expiryDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cvv" className="text-sm sm:text-base">{dir === 'rtl' ? 'CVV' : 'CVV'}</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                    maxLength={3}
                    className={cn(
                      errors.cvv ? 'border-red-500' : '',
                      "h-12 sm:h-14 text-base"
                    )}
                    type="password"
                    dir="ltr"
                  />
                  {errors.cvv && (
                    <p className="text-xs sm:text-sm text-red-500">{errors.cvv}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PayPal Payment */}
          {paymentMethod === 'paypal' && (
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                {dir === 'rtl'
                  ? 'سيتم توجيهك إلى PayPal لإتمام الدفع بشكل آمن'
                  : 'You will be redirected to PayPal to complete the payment securely'}
              </p>
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full"
                style={{
                  background: '#0070ba',
                  color: 'white'
                }}
              >
                {dir === 'rtl' ? 'الدفع عبر PayPal' : 'Pay with PayPal'}
              </Button>
            </div>
          )}

          {/* Bank Transfer Payment */}
          {paymentMethod === 'bank_transfer' && (
            <div className="space-y-4 overflow-visible">
              <div className="border-2 border-primary/20 rounded-lg p-4 sm:p-6 bg-muted/30 overflow-visible">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-bold text-lg">{dir === 'rtl' ? 'التحويل البنكي' : 'Bank Transfer'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {dir === 'rtl'
                        ? 'قم بتحويل المبلغ إلى الحساب البنكي التالي'
                        : 'Transfer the amount to the following bank account'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 bg-background p-4 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">{dir === 'rtl' ? 'اسم البنك' : 'Bank Name'}:</span>
                    <span className="text-sm font-mono">Royal Bank International</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">{dir === 'rtl' ? 'رقم الحساب' : 'Account Number'}:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">1234 5678 9012 3456</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText('1234567890123456');
                          alert(dir === 'rtl' ? 'تم نسخ رقم الحساب' : 'Account number copied');
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <span className="text-xs">📋</span>
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">{dir === 'rtl' ? 'IBAN' : 'IBAN'}:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">US64 SVBK US6S 1234 5678 9012 3456</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText('US64 SVBK US6S 1234 5678 9012 3456');
                          alert(dir === 'rtl' ? 'تم نسخ IBAN' : 'IBAN copied');
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <span className="text-xs">📋</span>
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">{dir === 'rtl' ? 'اسم المستفيد' : 'Beneficiary Name'}:</span>
                    <span className="text-sm font-mono">Royal Chat Premium</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">{dir === 'rtl' ? 'المبلغ' : 'Amount'}:</span>
                    <span className="text-lg font-bold text-primary">$30.00 USD</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">{dir === 'rtl' ? 'SWIFT Code' : 'SWIFT Code'}:</span>
                    <span className="text-sm font-mono">SVBKUS6S</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>{dir === 'rtl' ? 'ملاحظة مهمة:' : 'Important Note:'}</strong> {dir === 'rtl'
                      ? 'بعد إتمام التحويل، سيتم تفعيل اشتراكك خلال 24 ساعة. يرجى إرفاق إيصال التحويل عند التواصل معنا.'
                      : 'After completing the transfer, your subscription will be activated within 24 hours. Please attach the transfer receipt when contacting us.'}
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  <Label htmlFor="transferReference">{dir === 'rtl' ? 'رقم المرجع (اختياري)' : 'Reference Number (Optional)'}</Label>
                  <Input
                    id="transferReference"
                    placeholder={dir === 'rtl' ? 'أدخل رقم المرجع من إيصال التحويل' : 'Enter reference number from transfer receipt'}
                    className={errors.transferReference ? 'border-red-500' : ''}
                    dir={dir}
                  />
                  {errors.transferReference && (
                    <p className="text-sm text-red-500">{errors.transferReference}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errors.payment && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-2">
              <X className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-600 dark:text-red-400">{errors.payment}</p>
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              {dir === 'rtl'
                ? 'جميع المدفوعات مشفرة وآمنة. لن نخزن معلومات بطاقتك الائتمانية.'
                : 'All payments are encrypted and secure. We do not store your credit card information.'}
            </p>
          </div>

          {/* Action Buttons - Better mobile layout */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 h-12 sm:h-14 text-base sm:text-lg min-h-[48px] touch-manipulation"
              disabled={isProcessing}
            >
              {dir === 'rtl' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1 h-12 sm:h-14 text-base sm:text-lg min-h-[48px] touch-manipulation"
              style={{
                background: paymentMethod === 'card'
                  ? `linear-gradient(135deg, hsl(var(--chat-from)), hsl(var(--chat-to)))`
                  : paymentMethod === 'paypal'
                  ? '#0070ba'
                  : `linear-gradient(135deg, hsl(var(--chat-from)), hsl(var(--chat-to)))`
              }}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  <span className="text-sm sm:text-base">{dir === 'rtl' ? 'جاري المعالجة...' : 'Processing...'}</span>
                </>
              ) : (
                <>
                  {paymentMethod === 'bank_transfer' ? (
                    <>
                      <Building2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="text-sm sm:text-base">{dir === 'rtl' ? 'تأكيد التحويل' : 'Confirm Transfer'}</span>
                    </>
                  ) : paymentMethod === 'paypal' ? (
                    <>
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="text-sm sm:text-base">{dir === 'rtl' ? 'الدفع عبر PayPal' : 'Pay with PayPal'}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="text-sm sm:text-base">{dir === 'rtl' ? 'دفع $30' : 'Pay $30'}</span>
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}
