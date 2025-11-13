/**
 * Booking Payments Component
 * Displays payment list, refund history, and payment actions
 */

import React, { useState } from 'react';
import {
  Payment,
  formatCurrency,
  formatDateTime,
  getPaymentMethod,
  getPaymentCurrency,
} from '../../lib/booking';

interface BookingPaymentsProps {
  payments: Payment[];
  outstandingBalance: number;
  currency?: string;
  onChargeCard?: () => void;
  onRecordCash?: () => void;
  onIssueRefund?: (paymentId: number) => void;
}

export default function BookingPayments({
  payments,
  outstandingBalance,
  currency = 'INR',
  onChargeCard,
  onRecordCash,
  onIssueRefund,
}: BookingPaymentsProps) {
  const [selectedPayment, setSelectedPayment] = useState<number | null>(null);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'AUTHORIZED':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REFUNDED':
        return 'bg-purple-100 text-purple-800';
      case 'FAILED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'RAZORPAY':
        return (
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'CASH':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'CARD_ON_FILE':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const totalPaid = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Math.abs(p.amount), 0);

  const totalRefunded = payments
    .filter((p) => p.status === 'REFUNDED')
    .reduce((sum, p) => sum + Math.abs(p.amount), 0);

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Payment Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-500">Total Paid</label>
            <p className="mt-1 text-lg font-medium text-green-600">
              {formatCurrency(totalPaid, currency)}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Total Refunded</label>
            <p className="mt-1 text-lg font-medium text-purple-600">
              {formatCurrency(totalRefunded, currency)}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Outstanding Balance</label>
            <p className={`mt-1 text-lg font-medium ${outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(outstandingBalance, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Actions */}
      {(onChargeCard || onRecordCash) && outstandingBalance > 0 && (
        <div className="flex space-x-3">
          {onChargeCard && (
            <button
              onClick={onChargeCard}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Charge Card
            </button>
          )}
          {onRecordCash && (
            <button
              onClick={onRecordCash}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Record Cash Payment
            </button>
          )}
        </div>
      )}

      {/* Payments List */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-4">Payment History</h3>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No payments found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getPaymentMethodIcon(getPaymentMethod(payment))}
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(Math.abs(payment.amount), getPaymentCurrency(payment, currency))}
                        </p>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        <span className="capitalize">{getPaymentMethod(payment).replace(/_/g, ' ')}</span>
                        {(payment.externalTxnId || payment.razorpayPaymentId) && (
                          <span className="ml-2">• Txn ID: {payment.externalTxnId || payment.razorpayPaymentId}</span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {formatDateTime(payment.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {payment.status === 'COMPLETED' && onIssueRefund && (
                      <button
                        onClick={() => {
                          setSelectedPayment(payment.id);
                          onIssueRefund(payment.id);
                        }}
                        className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Issue Refund
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refund History */}
      {payments.some((p) => p.status === 'REFUNDED') && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Refund History</h3>
          <div className="space-y-3">
            {payments
              .filter((p) => p.status === 'REFUNDED')
              .map((payment) => (
                <div
                  key={payment.id}
                  className="border border-purple-200 rounded-lg p-4 bg-purple-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <div>
                        <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          Refund: {formatCurrency(Math.abs(payment.amount), getPaymentCurrency(payment, currency))}
                        </p>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            REFUNDED
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          <span className="capitalize">{getPaymentMethod(payment).replace(/_/g, ' ')}</span>
                          {(payment.externalTxnId || payment.razorpayPaymentId) && (
                            <span className="ml-2">• Txn ID: {payment.externalTxnId || payment.razorpayPaymentId}</span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          {formatDateTime(payment.updatedAt || payment.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

