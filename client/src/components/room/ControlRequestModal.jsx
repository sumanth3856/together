import React from 'react';

export function ControlRequestModal({ requestNotice, onRespond }) {
  if (!requestNotice) return null;

  return (
    <div className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl bg-surface-container-lowest p-3 pr-2 shadow-lg ring-1 ring-amber-200 toast-in">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <span className="material-symbols-outlined text-[16px] text-amber-700">key</span>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-label-lg text-sm text-amber-700 mb-1">
            Control Request
          </h4>
          <p className="text-sm leading-snug text-on-surface">
            <strong className="text-on-surface">{requestNotice.nickname}</strong>
            {' '}wants playback control.
          </p>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onRespond(requestNotice.socketId, true)}
              className="flex-1 min-h-[36px] rounded-lg bg-green-600 text-on-primary text-sm font-label-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[13px]">check_circle</span>
              <span>Grant</span>
            </button>
            <button
              onClick={() => onRespond(requestNotice.socketId, false)}
              className="flex-1 min-h-[36px] rounded-lg bg-red-600 text-on-primary text-sm font-label-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[13px]">cancel</span>
              <span>Decline</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
