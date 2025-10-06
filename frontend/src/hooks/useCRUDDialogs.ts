import { useState, useCallback } from 'react';

export interface CRUDDialogState<T> {
  isCreateOpen: boolean;
  isEditOpen: boolean;
  isViewOpen: boolean;
  isDeleteOpen: boolean;
  selectedItem: T | null;
  deleteTarget: T | null;
}

export interface CRUDDialogActions<T> {
  openCreate: (initialData?: Partial<T>) => void;
  openEdit: (item?: T) => void;
  openView: (item: T) => void;
  openDelete: (item: T) => void;
  closeCreate: () => void;
  closeEdit: () => void;
  closeView: () => void;
  closeDelete: () => void;
  closeAll: () => void;
  resetSelection: () => void;
  selectItem: (item: T) => void;
}

export function useCRUDDialogs<T>(): CRUDDialogState<T> & CRUDDialogActions<T> {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  const openCreate = useCallback((initialData?: Partial<T>) => {
    setIsCreateOpen(true);
    setSelectedItem(initialData as T || null);
  }, []);

  const openEdit = useCallback((item?: T) => {
    if (item) {
      setSelectedItem(item);
    }
    setIsEditOpen(true);
  }, []);

  const openView = useCallback((item: T) => {
    setSelectedItem(item);
    setIsViewOpen(true);
  }, []);

  const openDelete = useCallback((item: T) => {
    setDeleteTarget(item);
    setIsDeleteOpen(true);
  }, []);

  const closeCreate = useCallback(() => {
    setIsCreateOpen(false);
  }, []);

  const closeEdit = useCallback(() => {
    setIsEditOpen(false);
    setSelectedItem(null);
  }, []);

  const closeView = useCallback(() => {
    setIsViewOpen(false);
    setSelectedItem(null);
  }, []);

  const closeDelete = useCallback(() => {
    setIsDeleteOpen(false);
    setDeleteTarget(null);
  }, []);

  const closeAll = useCallback(() => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsViewOpen(false);
    setIsDeleteOpen(false);
    setSelectedItem(null);
    setDeleteTarget(null);
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedItem(null);
    setDeleteTarget(null);
  }, []);

  const selectItem = useCallback((item: T) => {
    setSelectedItem(item);
  }, []);

  return {
    isCreateOpen,
    isEditOpen,
    isViewOpen,
    isDeleteOpen,
    selectedItem,
    deleteTarget,
    openCreate,
    openEdit,
    openView,
    openDelete,
    closeCreate,
    closeEdit,
    closeView,
    closeDelete,
    closeAll,
    resetSelection,
    selectItem
  };
}