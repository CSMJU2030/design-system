"use client";

/**
 * useApi / useMutation — hook มาตรฐานสำหรับดึงและส่งข้อมูล
 * อ้างอิง §7.1 (Utility บังคับใช้) · §9 (4 สถานะหน้าจอ)
 *
 * ทำไมต้องมี: §9.1 กำหนดว่า loading < 300ms ห้ามแสดงอะไร (การกระพริบทำให้รู้สึกช้ากว่าเดิม)
 * ถ้าปล่อยให้ 37 คนเขียน useEffect เอง จะไม่มีใครทำ delay 300ms นี้เลย
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { csmjuFetchEnvelope, type CsmjuFetchOptions } from "./api";
import { isCsmjuApiError, type CsmjuErrorUi, mapApiError } from "./errors";
import type { CsmjuSuccessEnvelope } from "./errors";

/** §9.1 ต่ำกว่านี้ไม่ต้องแสดง skeleton */
const LOADING_DELAY_MS = 300;

export interface UseApiState<T> {
  data: T | null;
  meta: CsmjuSuccessEnvelope<T>["meta"];
  /** true เมื่อโหลดนานเกิน 300ms แล้วเท่านั้น — ผูกกับ <Skeleton> ได้ตรงๆ */
  loading: boolean;
  /** true ตั้งแต่วินาทีแรกที่เริ่มยิง — ใช้กับปุ่ม refresh ที่ไม่ต้องรอ 300ms */
  fetching: boolean;
  error: CsmjuErrorUi | null;
  refetch: () => void;
}

export interface UseApiOptions extends CsmjuFetchOptions {
  /** ไม่ยิงจนกว่าจะเป็น true — ใช้เมื่อยังไม่รู้ id */
  enabled?: boolean;
}

/**
 * ดึงข้อมูลจาก API ของระบบย่อย
 *
 * @example
 * const { data, meta, loading, error, refetch } = useApi<Item[]>(
 *   "/api/v1/equipment-items",
 *   { query: { page, per_page: 20 } },
 * );
 */
export function useApi<T>(
  path: string,
  options: UseApiOptions = {},
): UseApiState<T> {
  const { enabled = true, ...fetchOptions } = options;
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<CsmjuSuccessEnvelope<T>["meta"]>(undefined);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<CsmjuErrorUi | null>(null);
  const [tick, setTick] = useState(0);

  // serialize เพื่อให้ useEffect ไม่ยิงซ้ำเมื่อ object ถูกสร้างใหม่ทุก render
  const optionsKey = JSON.stringify({
    query: fetchOptions.query ?? null,
    body: fetchOptions.body ?? null,
    method: fetchOptions.method ?? "GET",
  });

  const optionsRef = useRef(fetchOptions);
  optionsRef.current = fetchOptions;

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const controller = new AbortController();

    setFetching(true);
    setError(null);
    const delay = setTimeout(() => {
      if (alive) setLoading(true);
    }, LOADING_DELAY_MS);

    csmjuFetchEnvelope<T>(path, { ...optionsRef.current, signal: controller.signal })
      .then((env) => {
        if (!alive) return;
        setData(env.data);
        setMeta(env.meta);
      })
      .catch((e) => {
        if (!alive) return;
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(isCsmjuApiError(e) ? e.ui : mapApiError({ code: "INTERNAL_ERROR" }));
      })
      .finally(() => {
        if (!alive) return;
        clearTimeout(delay);
        setLoading(false);
        setFetching(false);
      });

    return () => {
      alive = false;
      clearTimeout(delay);
      controller.abort();
    };
  }, [path, optionsKey, enabled, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { data, meta, loading, fetching, error, refetch };
}

export interface UseMutationResult<TBody, TResult> {
  mutate: (body?: TBody) => Promise<TResult | null>;
  /** กำลังส่ง — ผูกกับ prop loading ของ <Button> */
  loading: boolean;
  error: CsmjuErrorUi | null;
  /** ล้าง error หลังผู้ใช้แก้ฟอร์มแล้ว */
  reset: () => void;
  data: TResult | null;
}

/**
 * ส่งข้อมูล (POST/PUT/PATCH/DELETE)
 *
 * error ที่เป็น VALIDATION_ERROR จะมี .field ติดมาด้วย ให้หน้าจอ focus ไปยังช่องนั้นได้ทันที (§9.3)
 *
 * @example
 * const create = useMutation<BorrowInput, BorrowRecord>("/api/v1/borrow-records");
 * <Button loading={create.loading} onClick={() => create.mutate(form)}>ยืมครุภัณฑ์</Button>
 */
export function useMutation<TBody = unknown, TResult = unknown>(
  path: string,
  options: CsmjuFetchOptions = {},
): UseMutationResult<TBody, TResult> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CsmjuErrorUi | null>(null);
  const [data, setData] = useState<TResult | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutate = useCallback(
    async (body?: TBody) => {
      setLoading(true);
      setError(null);
      try {
        const env = await csmjuFetchEnvelope<TResult>(path, {
          method: "POST",
          ...optionsRef.current,
          body: body ?? optionsRef.current.body,
        });
        setData(env.data);
        return env.data;
      } catch (e) {
        setError(isCsmjuApiError(e) ? e.ui : mapApiError({ code: "INTERNAL_ERROR" }));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [path],
  );

  const reset = useCallback(() => {
    setError(null);
    setData(null);
  }, []);

  return { mutate, loading, error, reset, data };
}
