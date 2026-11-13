import React from 'react';
import { Clock, Heart, Star } from 'lucide-react';
import { CustomerProfile, ServeEvaluation } from '../types/game';

interface ReceiptToastProps {
  customer: CustomerProfile;
  evaluation: ServeEvaluation;
  onNext: () => void;
}

export const ReceiptToast: React.FC<ReceiptToastProps> = ({
  customer,
  evaluation,
  onNext,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 pointer-events-auto bg-[#2C1E17]/25">
      <div className="sketch-card washi-tape max-w-md w-full p-5 sm:p-6">
        <div className="text-center">
          <div className="flex justify-center gap-1 mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < evaluation.stars
                    ? 'fill-[#E8AE42] text-[#3B2318]'
                    : 'text-[#C5B298]'
                }`}
              />
            ))}
          </div>
          <h3 className="font-sketch text-2xl text-[#3B2318]">{evaluation.headline}</h3>
          <p className="text-xs font-semibold text-[#8A5A44]">
            {customer.name} •{' '}
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> {Math.round(evaluation.patienceLeft * 100)}% Patience Left
            </span>
          </p>
        </div>

        <div className="mt-3 p-3 rounded-xl bg-[#F4E8D3] border border-[#CBB494] text-sm italic text-[#4E372D] text-center">
          “{evaluation.customerReply}”
        </div>

        {/* Receipt Paper Breakdown */}
        <div className="mt-3.5 bg-[#FFFDF7] border-2 border-dashed border-[#B29A7D] rounded-xl p-3 text-xs space-y-1.5">
          <div className="flex justify-between font-semibold text-[#3B2318]">
            <span>Drink Order</span>
            <span>+${evaluation.basePay.toFixed(2)}</span>
          </div>
          {evaluation.lines.map((l, idx) => (
            <div
              key={idx}
              className={`flex justify-between ${
                l.positive ? 'text-[#4B6B44]' : 'text-[#8C6D58]'
              }`}
            >
              <span>• {l.label}</span>
              <span>
                {l.amount > 0 ? `+$${l.amount.toFixed(2)}` : l.amount < 0 ? `-$${Math.abs(l.amount).toFixed(2)}` : '—'}
              </span>
            </div>
          ))}
          <div className="pt-1.5 border-t border-dashed border-[#CBB494] flex justify-between font-bold text-sm text-[#B85438]">
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 fill-[#E57A86] text-[#3B2318]" /> Tip Jar Total
            </span>
            <span>+${evaluation.totalEarned.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={onNext}
          className="sketch-btn sketch-btn-primary w-full mt-4 py-2 text-lg"
        >
          Welcome Next Customer ☕
        </button>
      </div>
    </div>
  );
};
