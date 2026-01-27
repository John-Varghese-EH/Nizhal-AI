import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pin, Trash2, X, Search, GripVertical } from 'lucide-react';
import { quickNotesService } from '../../services/QuickNotesService';

/**
 * QuickNotes - Floating sticky notes widget
 */
const QuickNotes = ({ isOpen, onClose }) => {
    const [notes, setNotes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingNote, setEditingNote] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadNotes();
        }
    }, [isOpen]);

    const loadNotes = async () => {
        await quickNotesService.initialize();
        setNotes(quickNotesService.getNotes());
    };

    const handleCreateNote = async () => {
        const note = await quickNotesService.createNote({
            content: '',
            color: 'yellow'
        });
        setNotes(quickNotesService.getNotes());
        setEditingNote(note.id);
    };

    const handleUpdateNote = async (id, updates) => {
        await quickNotesService.updateNote(id, updates);
        setNotes(quickNotesService.getNotes());
    };

    const handleDeleteNote = async (id) => {
        await quickNotesService.deleteNote(id);
        setNotes(quickNotesService.getNotes());
    };

    const handleTogglePin = async (id) => {
        await quickNotesService.togglePin(id);
        setNotes(quickNotesService.getNotes());
    };

    const filteredNotes = searchQuery
        ? quickNotesService.search(searchQuery)
        : notes;

    const colors = quickNotesService.getColors();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-5xl max-h-[80vh] bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                📝 Quick Notes
                            </h2>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search notes..."
                                    className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 w-64"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCreateNote}
                                className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition-colors"
                            >
                                <Plus size={16} />
                                New Note
                            </motion.button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-white/50" />
                            </button>
                        </div>
                    </div>

                    {/* Notes Grid */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {filteredNotes.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredNotes.map(note => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        colors={colors}
                                        isEditing={editingNote === note.id}
                                        onEdit={() => setEditingNote(note.id)}
                                        onSave={() => setEditingNote(null)}
                                        onUpdate={(updates) => handleUpdateNote(note.id, updates)}
                                        onDelete={() => handleDeleteNote(note.id)}
                                        onTogglePin={() => handleTogglePin(note.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-white/30">
                                <div className="text-6xl mb-4">📝</div>
                                <p className="text-lg">No notes yet</p>
                                <p className="text-sm">Click "New Note" to create your first one</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-white/10 flex items-center justify-between text-xs text-white/30">
                        <span>{notes.length} notes • {notes.filter(n => n.isPinned).length} pinned</span>
                        <span>Click note to edit • Double-click color to change</span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

/**
 * Individual Note Card
 */
const NoteCard = ({ note, colors, isEditing, onEdit, onSave, onUpdate, onDelete, onTogglePin }) => {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const textareaRef = useRef(null);
    const colorStyle = quickNotesService.getColorStyle(note.color);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isEditing]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative group rounded-xl overflow-hidden shadow-lg"
            style={{ backgroundColor: colorStyle.bg, borderColor: colorStyle.border }}
        >
            {/* Pin Badge */}
            {note.isPinned && (
                <div className="absolute top-0 right-0 p-1">
                    <Pin size={14} style={{ color: colorStyle.text }} fill="currentColor" />
                </div>
            )}

            {/* Content */}
            <div className="p-3 min-h-[120px]">
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={note.content}
                        onChange={(e) => onUpdate({ content: e.target.value })}
                        onBlur={onSave}
                        className="w-full h-24 bg-transparent border-none resize-none focus:outline-none text-sm"
                        style={{ color: colorStyle.text }}
                        placeholder="Write your note..."
                    />
                ) : (
                    <div
                        onClick={onEdit}
                        className="w-full h-24 text-sm overflow-y-auto cursor-text whitespace-pre-wrap"
                        style={{ color: colorStyle.text }}
                    >
                        {note.content || <span className="opacity-50">Click to add content...</span>}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div
                className="px-3 py-2 flex items-center justify-between border-t"
                style={{ borderColor: colorStyle.border + '40' }}
            >
                <div className="flex items-center gap-1">
                    {/* Color Picker */}
                    <div className="relative">
                        <button
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className="w-4 h-4 rounded-full border-2"
                            style={{ backgroundColor: colorStyle.border, borderColor: colorStyle.text }}
                        />
                        {showColorPicker && (
                            <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-lg shadow-xl flex gap-1 z-10">
                                {colors.map(color => (
                                    <button
                                        key={color.id}
                                        onClick={() => {
                                            onUpdate({ color: color.id });
                                            setShowColorPicker(false);
                                        }}
                                        className="w-5 h-5 rounded-full border-2 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: color.bg, borderColor: color.border }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    <span className="text-[10px] opacity-50" style={{ color: colorStyle.text }}>
                        {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onTogglePin}
                        className="p-1 hover:bg-black/10 rounded transition-colors"
                    >
                        <Pin size={12} style={{ color: colorStyle.text }} fill={note.isPinned ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                    >
                        <Trash2 size={12} className="text-red-500" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default QuickNotes;
