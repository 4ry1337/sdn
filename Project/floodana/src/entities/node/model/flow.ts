export interface FlowMatch {
  ethType?: string;
  ethSrc?: string;
  ethDst?: string;
  ipv4Src?: string;
  ipv4Dst?: string;
  ipProto?: string;
  tcpSrc?: number;
  tcpDst?: number;
}

export interface FlowEntry {
  name: string;
  switch: string;
  priority: number;
  ingressPort?: string;
  active: boolean;
  actions: string;
  match?: FlowMatch;
  cookie?: string;
  idleTimeout?: number;
  hardTimeout?: number;
}
