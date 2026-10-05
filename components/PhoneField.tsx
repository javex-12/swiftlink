"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { CountrySelector } from "./CountrySelector";
import {
  splitPhoneNumber,
  cleanPastedNationalNumber,
  normalizePhoneNumber,
  SUPPORTED_COUNTRIES,
} from "@/lib/phone";
import { type CountryCode } from "libphonenumber-js";
import { cn } from "@/lib/utils";

export interface PhoneFieldProps {
  value: string;
  onChange: (e164Value: string) => void;
  defaultCountry?: string; // e.g. "NG", "GH", "US"
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

export function PhoneField({
  value,
  onChange,
  defaultCountry = "NG",
  label,
  hint,
  error: controlledError,
  placeholder = "808 123 4567",
  disabled = false,
  required = false,
  className,
  id,
}: PhoneFieldProps) {
  // Safe country fallback
  const validDefaultCountry = (
    SUPPORTED_COUNTRIES.some((c) => c.code === defaultCountry.toUpperCase())
      ? defaultCountry.toUpperCase()
      : "NG"
  ) as CountryCode;

  // Split phone into countryCode, callingCode, and pure nationalNumber
  const initial = splitPhoneNumber(value, validDefaultCountry);
  const [countryCode, setCountryCode] = useState<CountryCode>(initial.countryCode);
  const [callingCode, setCallingCode] = useState<string>(initial.callingCode);
  const [nationalNumber, setNationalNumber] = useState<string>(initial.nationalNumber);

  // Sync if external value changes (e.g. store switch)
  const lastEmittedValue = useRef<string>(value);
  useEffect(() => {
    if (value !== lastEmittedValue.current) {
      const parsed = splitPhoneNumber(value, validDefaultCountry);
      setCountryCode(parsed.countryCode);
      setCallingCode(parsed.callingCode);
      setNationalNumber(parsed.nationalNumber);
      lastEmittedValue.current = value;
    }
  }, [value, validDefaultCountry]);

  // Combine and emit E.164
  const emitChange = useCallback(
    (newCalling: string, newNational: string, newCountry: CountryCode) => {
      const cleanDigits = newNational.replace(/\D/g, "");
      if (!cleanDigits) {
        lastEmittedValue.current = "";
        onChange("");
        return;
      }

      // Check with normalizePhoneNumber to produce correct E.164
      const combined = `${newCalling}${cleanDigits}`;
      const res = normalizePhoneNumber(combined, newCountry);
      const e164 = res.isValid ? res.normalized : combined;
      lastEmittedValue.current = e164;
      onChange(e164);
    },
    [onChange],
  );

  // When country changes from picker
  const handleCountryChange = (newCalling: string, newCountry: string) => {
    const code = newCountry as CountryCode;
    setCallingCode(newCalling);
    setCountryCode(code);
    emitChange(newCalling, nationalNumber, code);
  };

  // When typing into the national number input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // If user typed dial code like +234 or leading 0, clean it
    const dialDigits = callingCode.replace(/\D/g, "");
    const cleanDigits = raw.replace(/\D/g, "");

    let cleaned = raw;
    if (cleanDigits.startsWith(dialDigits) && cleanDigits.length > dialDigits.length) {
      cleaned = cleanDigits.slice(dialDigits.length);
    } else if (cleaned.startsWith("0")) {
      cleaned = cleaned.slice(1);
    }

    setNationalNumber(cleaned);
    emitChange(callingCode, cleaned, countryCode);
  };

  // When pasting a phone number (e.g. +234 808 123 4567 or 08081234567)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (!pasted) return;

    e.preventDefault();
    const result = cleanPastedNationalNumber(pasted, callingCode);

    let activeCalling = callingCode;
    let activeCountry = countryCode;

    if (result.countryCode) {
      const match = SUPPORTED_COUNTRIES.find((c) => c.code === result.countryCode);
      if (match) {
        activeCalling = match.callingCode;
        activeCountry = match.code;
        setCallingCode(match.callingCode);
        setCountryCode(match.code);
      }
    }

    setNationalNumber(result.nationalNumber);
    emitChange(activeCalling, result.nationalNumber, activeCountry);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-[#E8F1EC]">
          {label} {required && <span className="text-[#FF8A8A]">*</span>}
        </label>
      )}

      <div className="flex gap-2">
        <CountrySelector
          value={callingCode}
          onChange={handleCountryChange}
          className="shrink-0"
        />

        <div className="relative flex-1">
          <input
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            disabled={disabled}
            value={nationalNumber}
            onChange={handleInputChange}
            onPaste={handlePaste}
            placeholder={placeholder}
            className={cn(
              "h-11 min-h-[44px] w-full rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3.5 py-2.5",
              "text-sm font-semibold tabular-nums text-[#E8F1EC] placeholder:text-[#9DB3A8]/60",
              "outline-none transition focus:border-[#19C37D]",
              controlledError && "border-[#FF8A8A] focus:border-[#FF8A8A]",
              disabled && "opacity-60 cursor-not-allowed",
            )}
          />
        </div>
      </div>

      {controlledError && (
        <p className="text-xs text-[#FF8A8A] mt-1">{controlledError}</p>
      )}

      {hint && !controlledError && (
        <p className="text-[11px] text-[#9DB3A8] mt-1">{hint}</p>
      )}
    </div>
  );
}
