export interface PcFormFieldState {
  states?: {
    error?: { message?: string }
  }
}

export interface PcFormContext {
  register: (name: string, options: { name: string }) => void
  fields?: Record<string, PcFormFieldState>
}
