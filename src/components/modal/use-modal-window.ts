"use client";

import { useCallback } from "react";

import {
  closeModalWindowCommand,
  openModalWindowCommand,
  type OpenModalWindowOptions
} from "@/config/modal-window";

export function useModalWindow() {
  const openModal = useCallback(async (options: OpenModalWindowOptions) => {
    const label = await openModalWindowCommand(options);
    return label;
  }, []);

  const closeModal = useCallback(async (label: string) => {
    await closeModalWindowCommand(label);
  }, []);

  return { openModal, closeModal };
}
