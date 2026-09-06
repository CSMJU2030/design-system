"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "../feedback/ErrorState";

interface Props {
  children: ReactNode;
  /** ปุ่มกลับหน้าหลักของระบบย่อย */
  onGoHome?: () => void;
}

interface State {
  hasError: boolean;
}

/**
 * §5.1 AppShell ต้องมี error boundary — จับ error ที่หลุดมาแล้วแสดงหน้า error มาตรฐาน
 *
 * 🔴 §16.1.1 ห้ามแสดง error.message ดิบให้ผู้ใช้เห็น
 *    รายละเอียดจริงส่งเข้า console เท่านั้น เพื่อให้ AIE debug ได้แต่ผู้ใช้ไม่เห็น stack trace
 */
export class CsmjuErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error("[csmju] เกิด error ที่ไม่ได้จับไว้ใน component tree", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorState
          title="ระบบขัดข้องชั่วคราว"
          description="เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองอีกครั้ง หากยังพบปัญหา กรุณาแจ้งผู้ดูแลระบบย่อยนี้"
          onRetry={() => this.setState({ hasError: false })}
          onGoHome={this.props.onGoHome}
        />
      );
    }
    return this.props.children;
  }
}
