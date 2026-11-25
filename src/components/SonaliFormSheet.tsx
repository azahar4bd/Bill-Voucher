import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  FormType,
  ReceiverFormData,
  SONALI_BANK_LOGO_URI,
  SenderFormData,
} from '../data/bankDefaults';

interface SonaliFormSheetProps {
  formType: FormType;
  sender: SenderFormData;
  receiver: ReceiverFormData;
}

const MAX_FONT_PT = 10.2;
const MIN_FONT_PT = 4.2;

/** Measures text independently of the (possibly clipped) slot element. */
function measureTextWidth(
  text: string,
  fontPt: number,
  source: HTMLElement,
): number {
  const probe = document.createElement('span');
  const style = window.getComputedStyle(source);
  probe.textContent = text;
  probe.style.position = 'absolute';
  probe.style.left = '-10000px';
  probe.style.top = '0';
  probe.style.visibility = 'hidden';
  probe.style.whiteSpace = 'nowrap';
  probe.style.fontFamily = style.fontFamily;
  probe.style.fontWeight = style.fontWeight;
  probe.style.letterSpacing = style.letterSpacing;
  probe.style.fontSize = `${fontPt}pt`;
  document.body.appendChild(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width;
}

function DottedSlot({
  value,
  flex,
  width,
  center = false,
}: {
  value?: string;
  flex?: number;
  width?: string;
  center?: boolean;
}) {
  const slotRef = useRef<HTMLSpanElement>(null);
  const valRef = useRef<HTMLSpanElement>(null);
  const [fontPt, setFontPt] = useState<number>(MAX_FONT_PT);
  const [allowWrap, setAllowWrap] = useState<boolean>(false);

  useLayoutEffect(() => {
    const slotEl = slotRef.current;
    const valEl = valRef.current;
    if (!slotEl || !valEl) return;

    const fitText = () => {
      const clean = (value || '').trim();
      const slotW = slotEl.clientWidth;
      if (!clean || slotW <= 0) {
        setAllowWrap(false);
        setFontPt(MAX_FONT_PT);
        return;
      }

      const avail = Math.max(12, slotW - 10);
      if (measureTextWidth(clean, MAX_FONT_PT, valEl) <= avail) {
        setAllowWrap(false);
        setFontPt(MAX_FONT_PT);
        return;
      }

      // Find the largest font that still fits on one line.
      let low = MIN_FONT_PT;
      let high = MAX_FONT_PT;
      let best = MIN_FONT_PT;
      for (let i = 0; i < 14; i += 1) {
        const mid = Number(((low + high) / 2).toFixed(2));
        if (measureTextWidth(clean, mid, valEl) <= avail) {
          best = mid;
          low = mid;
        } else {
          high = mid;
        }
      }
      best = Math.floor(best * 10) / 10;

      if (measureTextWidth(clean, best, valEl) <= avail) {
        setAllowWrap(false);
        setFontPt(best);
        return;
      }

      // Even the smallest font cannot fit: wrap and grow instead of clipping.
      setAllowWrap(true);
      setFontPt(MIN_FONT_PT);
    };

    fitText();
    const ro = new ResizeObserver(fitText);
    ro.observe(slotEl);
    return () => ro.disconnect();
  }, [value, flex, width]);

  const style: React.CSSProperties = width
    ? { width, flexShrink: 0 }
    : { flex: flex ?? 1 };
  if (allowWrap) {
    style.overflow = 'visible';
    style.alignItems = 'flex-start';
  }

  return (
    <span
      ref={slotRef}
      className={`sonali-slot ${width ? '' : 'sonali-slot-grow'} ${
        center ? 'justify-center' : ''
      }`}
      style={style}
    >
      <span
        ref={valRef}
        className={`sonali-val ${allowWrap ? 'sonali-val-wrap' : ''}`}
        style={{
          fontSize: `${fontPt}pt`,
          whiteSpace: allowWrap ? 'normal' : 'nowrap',
          lineHeight: 1.15,
          wordBreak: allowWrap ? 'break-word' : 'normal',
          maxWidth: allowWrap ? '100%' : undefined,
          minWidth: 0,
        }}
      >
        {value || '\u00A0'}
      </span>
    </span>
  );
}

function ScissorCutLine() {
  const scissors = [0, 1, 2, 3, 4, 5];
  return (
    <div className="sonali-cut-line" aria-hidden="true">
      <div className="sonali-cut-dots" />
      {scissors.map((idx) => (
        <span key={idx} className="sonali-cut-scissor">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
        </span>
      ))}
    </div>
  );
}

export const SonaliFormSheet: React.FC<SonaliFormSheetProps> = ({
  formType,
  sender,
  receiver,
}) => {
  const isBEFTN = formType === 'BEFTN';
  const amountText = sender.amount.trim() ? `${sender.amount.trim()}/-` : '';
  const recvAmtRaw = receiver.receiverAmount.trim() || sender.amount.trim();
  const recvAmountText = recvAmtRaw ? `${recvAmtRaw}/-` : '';
  const ackWords = sender.amountWords.trim() || receiver.receiverAmountWords.trim();

  const rtgsAckBranch =
    receiver.receivingBranch.trim() && receiver.district.trim()
      ? `${receiver.receivingBranch.trim()},${receiver.district.trim()}`
      : receiver.receivingBranch.trim();

  const ackBranchDisplay = isBEFTN ? receiver.receivingBranch.trim() : rtgsAckBranch;

  return (
    <div className={`sonali-sheet ${isBEFTN ? 'is-beftn' : 'is-rtgs'}`}>
      {/* Top Header with Centered Logo and BEFTN Sys No. Box */}
      <div className="sonali-header">
        <img
          src={SONALI_BANK_LOGO_URI}
          alt="Sonali Bank Limited"
          className="sonali-logo"
        />
        {isBEFTN && (
          <div className="sonali-sys-box">
            <div className="sonali-sys-line" />
            <div className="sonali-sys-label">Sys no. (Bank&apos;s use only)</div>
          </div>
        )}
      </div>

      {/* Form Title */}
      <h1 className="sonali-title">
        {isBEFTN
          ? 'BEFTN Outward (Credit) Application Form'
          : 'RTGS Application Form'}
      </h1>

      {/* Date & Manager Salutation */}
      <div className="sonali-form-row" style={{ marginBottom: '11px' }}>
        <span className="sonali-lbl">Date:</span>
        <DottedSlot value={sender.date} width="112px" />
      </div>

      <p className="sonali-letter-p" style={{ marginBottom: '10px' }}>
        The Manager,
      </p>

      <div className="sonali-form-row" style={{ marginBottom: '12px' }}>
        <DottedSlot value={sender.branch} width="176px" center />
        <span className="sonali-lbl">Branch</span>
      </div>

      <p className="sonali-letter-p">Dear Sir,</p>
      <p className="sonali-letter-p">
        I/We would like to request you to arrange fund transfer through{' '}
        {formType} facility as per receiver details/attached documents by
        debiting my/our below mentioning account maintaining with your branch
        with applicable charge &amp; Government Taxes.
      </p>

      {/* Sender Details */}
      <h2 className="sonali-sec-heading">Sender Details :</h2>

      <div className="sonali-form-row">
        <span className="sonali-lbl">Account Number:</span>
        <DottedSlot value={sender.accountNumber} flex={0.95} />
        <span className="sonali-lbl">Account Title:</span>
        <DottedSlot value={sender.accountTitle} flex={1.45} />
      </div>

      <div className="sonali-form-row">
        <span className="sonali-lbl">Amount:</span>
        <DottedSlot value={amountText} flex={0.36} />
        <span className="sonali-lbl">Amount in words:</span>
        <DottedSlot value={sender.amountWords} flex={2.4} />
      </div>

      <div className="sonali-form-row">
        <span className="sonali-lbl">Cheque no:</span>
        <DottedSlot value={sender.chequeNo} flex={0.62} />
        {isBEFTN && <span className="sonali-lbl">(If applicable)</span>}
        <span className="sonali-lbl">Account Holder&apos;s Mobile No:</span>
        <DottedSlot value={sender.mobileNo} flex={1.15} />
      </div>

      <div className="sonali-form-row">
        <span className="sonali-lbl">Account Holder&apos;s Branch Name:</span>
        <DottedSlot value={sender.branchName} flex={1} />
      </div>

      {/* BEFTN places Account Holder Signature + Bank's Use Only right after Sender Details */}
      {isBEFTN && (
        <>
          <div className="sonali-sig-right" style={{ marginTop: '34px' }}>
            <div className="sonali-sig-rule" />
            <div>Signature of Account Holder(s)</div>
          </div>

          <div className="sonali-bankuse-heading">For Bank&apos;s use only</div>
          <div className="sonali-bankuse-box">
            <div className="sonali-bankuse-grid">
              <div className="sonali-bankuse-col">
                <div className="sonali-bankuse-sig">
                  <div className="sonali-sig-rule" />
                  <div>Account debited by</div>
                </div>
                <div className="sonali-bankuse-sig-lower">
                  <div className="sonali-sig-rule" />
                  <div>Authorized By</div>
                </div>
              </div>
              <div className="sonali-bankuse-col">
                <div className="sonali-bankuse-sig">
                  <div className="sonali-sig-rule" />
                  <div>BEFTN Originated by</div>
                </div>
                <div className="sonali-bankuse-sig-lower">
                  <div className="sonali-sig-rule" />
                  <div>BEFTN verified by</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Receiver's Details */}
      <h2 className="sonali-sec-heading">Receiver&apos;s Details:</h2>

      {isBEFTN ? (
        <div className="sonali-form-row">
          <span className="sonali-lbl">Receiving Bank :</span>
          <DottedSlot value={receiver.receivingBank} flex={1.15} />
          <span className="sonali-lbl">District:</span>
          <DottedSlot value={receiver.district} flex={0.65} />
          <span className="sonali-lbl">Receiving Branch:</span>
          <DottedSlot value={receiver.receivingBranch} flex={1.05} />
        </div>
      ) : (
        <div className="sonali-form-row">
          <span className="sonali-lbl">Receiving Bank :</span>
          <DottedSlot value={receiver.receivingBank} flex={1.0} />
          <span className="sonali-lbl">Receiving Branch:</span>
          <DottedSlot value={receiver.receivingBranch} flex={1.05} />
          <span className="sonali-lbl">District:</span>
          <DottedSlot value={receiver.district} flex={0.65} />
        </div>
      )}

      <div className="sonali-form-row">
        <span className="sonali-lbl">Routing Number:</span>
        <DottedSlot value={receiver.routingNumber} flex={0.75} />
        <span className="sonali-lbl">
          {isBEFTN ? "Receiver's Account Number:" : 'Receiving Account Number:'}
        </span>
        <DottedSlot value={receiver.receiverAccountNumber} flex={1.25} />
      </div>

      <div className="sonali-form-row">
        <span className="sonali-lbl">Receiver&apos;s Name:</span>
        <DottedSlot value={receiver.receiverName} flex={1.55} />
        <span className="sonali-lbl">Amount:</span>
        <DottedSlot value={recvAmountText} flex={0.55} />
      </div>

      <div className="sonali-form-row">
        <span className="sonali-lbl">Amount is words :</span>
        <DottedSlot value={receiver.receiverAmountWords} flex={2.1} />
        <span className="sonali-lbl">Receiver&apos;s Mobile No:</span>
        <DottedSlot value={receiver.receiverMobile} flex={0.42} />
      </div>

      <div className="sonali-form-row">
        <span className="sonali-lbl">Purpose of Transaction :</span>
        <DottedSlot value={receiver.purpose} flex={1} />
      </div>

      {/* RTGS has an extra dotted line + Account Holder Signature + Bank's Use Only + Manager after Receiver's Details */}
      {!isBEFTN && (
        <>
          <div className="sonali-form-row" style={{ marginTop: '7px' }}>
            <DottedSlot value="" flex={1} />
          </div>

          <div className="sonali-sig-right" style={{ marginTop: '36px' }}>
            <div className="sonali-sig-rule" />
            <div>Signature of Account Holder(s)</div>
          </div>

          <div className="sonali-bankuse-heading">For Bank&apos;s use only</div>
          <div className="sonali-bankuse-box">
            <div className="sonali-bankuse-grid">
              <div className="sonali-bankuse-col">
                <div className="sonali-bankuse-sig">
                  <div className="sonali-sig-rule" />
                  <div>Originated by</div>
                </div>
              </div>
              <div className="sonali-bankuse-col">
                <div className="sonali-bankuse-sig">
                  <div className="sonali-sig-rule" />
                  <div>Authorised by</div>
                </div>
              </div>
            </div>
          </div>

          <div className="sonali-sig-right" style={{ marginTop: '36px' }}>
            <div className="sonali-sig-rule" />
            <div>Manager</div>
          </div>
        </>
      )}

      {/* Scissor Perforation / Tear Line */}
      <ScissorCutLine />

      {/* Acknowledgement Box */}
      <div className="sonali-ack-box">
        <div className="sonali-ack-title">ACKNOWLEDGEMENT</div>

        <div className="sonali-form-row" style={{ marginBottom: '7px' }}>
          <span className="sonali-lbl">Dated</span>
          <DottedSlot value={sender.date} width="110px" />
        </div>

        <div className="sonali-form-row" style={{ marginBottom: '7px' }}>
          <span className="sonali-lbl">
            Acknowledge that Sonali Bank Limited,
          </span>
          <DottedSlot value={sender.branch} flex={1.15} center />
          <span className="sonali-lbl">Branch has debited Tk.</span>
          <DottedSlot value={amountText} flex={0.55} />
        </div>

        <div className="sonali-form-row" style={{ marginBottom: '7px' }}>
          <span className="sonali-lbl">{isBEFTN ? '(In words' : 'In words'}</span>
          <DottedSlot value={ackWords} flex={2.1} />
          <span className="sonali-lbl">
            {isBEFTN ? ') from account number' : 'from account number'}
          </span>
          <DottedSlot value={sender.accountNumber} flex={0.58} />
          <span className="sonali-lbl">For {formType} to</span>
        </div>

        <div className="sonali-form-row" style={{ marginBottom: '0' }}>
          <span className="sonali-lbl">Account number</span>
          <DottedSlot value={receiver.receiverAccountNumber} flex={0.85} />
          <span className="sonali-lbl">of</span>
          <DottedSlot value={receiver.receivingBank} flex={0.85} />
          <span className="sonali-lbl">Bank of</span>
          <DottedSlot value={ackBranchDisplay} flex={0.95} />
          <span className="sonali-lbl">Branch.</span>
        </div>

        <div className="sonali-ack-sigs">
          <div className="sonali-ack-sig-item">
            <div className="sonali-sig-rule" />
            <div>{isBEFTN ? 'Authorized Signature' : 'Officer'}</div>
          </div>
          <div className="sonali-ack-sig-item">
            <div className="sonali-sig-rule" />
            <div>{isBEFTN ? 'Authorized Signature' : 'Manager'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
