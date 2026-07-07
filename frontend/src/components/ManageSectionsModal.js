import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Modal, { ModalBody, ModalFooter } from './ui/Modal';
import API from '../api/axios';

const SECTION_LABELS = {
  posts: 'Posts',
  about: 'About',
  albums: 'Albums',
  friends: 'Friends',
  reels: 'Reels',
};

const SortableSectionRow = ({ section, toggleEnabled }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.key,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <svg className="w-4 h-4 text-jolshaa-outline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>
      <span className={`flex-1 text-sm font-medium ${section.enabled ? 'text-jolshaa-on-surface' : 'text-jolshaa-on-surface-variant'}`}>
        {SECTION_LABELS[section.key] || section.key}
      </span>
      <button
        type="button"
        onClick={() => toggleEnabled(section.key)}
        className={`relative w-10 h-5.5 rounded-full transition-colors ${section.enabled ? 'bg-jolshaa-teal' : 'bg-jolshaa-surface-container-high'}`}
      >
        <span
          className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${section.enabled ? 'translate-x-[19px]' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  );
};

const ManageSectionsModal = ({ isOpen, onClose, sections, onSaved }) => {
  const [items, setItems] = useState(
    [...sections].sort((a, b) => a.order - b.order)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((s) => s.key === active.id);
      const newIndex = prev.findIndex((s) => s.key === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const toggleEnabled = (key) => {
    setItems((prev) =>
      prev.map((s) => (s.key === key ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.put('/users/profile-sections', { sections: items });
      onSaved?.(res.data.profileSectionSettings);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save section settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Sections" size="sm">
      <ModalBody>
        <p className="text-xs text-jolshaa-on-surface-variant mb-3">
          Drag to reorder, toggle to show or hide a section on your profile.
        </p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((s) => s.key)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((section) => (
                <SortableSectionRow key={section.key} section={section} toggleEnabled={toggleEnabled} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      </ModalBody>
      <ModalFooter>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-jolshaa-surface-container text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-jolshaa-teal text-jolshaa-on-teal hover:bg-jolshaa-teal-container transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default ManageSectionsModal;
