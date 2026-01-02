declare module '@vercel/analytics/next' {
  interface PageViewEvent {
    type: 'pageview';
    url: string;
  }
  interface CustomEvent {
    type: 'event';
    url: string;
  }
  type BeforeSendEvent = PageViewEvent | CustomEvent;
  type Mode = 'auto' | 'development' | 'production';
  type BeforeSend = (event: BeforeSendEvent) => BeforeSendEvent | null;
  export interface AnalyticsProps {
    beforeSend?: BeforeSend;
    debug?: boolean;
    mode?: Mode;
    scriptSrc?: string;
    endpoint?: string;
    dsn?: string;
  }
  export function Analytics(props?: AnalyticsProps): null;
  export type { AnalyticsProps, BeforeSend, BeforeSendEvent };
}

