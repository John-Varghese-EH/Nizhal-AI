import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Calendar, Clock, Tag, GripVertical, CheckCircle2 } from 'lucide-react';
import { taskBoardService } from '../../assistant/life-manager/TaskBoardService';

/**
 * TaskBoard - Kanban-style task management
 */
const TaskBoard = () => {
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState({ total: 0, done: 0, completionRate: 0 });
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', column: 'todo' });
    const [draggedTask, setDraggedTask] = useState(null);

    const columns = [
        { id: 'backlog', label: 'Backlog', color: 'slate' },
        { id: 'todo', label: 'To Do', color: 'blue' },
        { id: 'inProgress', label: 'In Progress', color: 'amber' },
        { id: 'done', label: 'Done', color: 'green' }
    ];

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        await taskBoardService.initialize();
        setTasks(taskBoardService.getTasks());
        setStats(taskBoardService.getStats());
    };

    const handleAddTask = async () => {
        if (!newTask.title.trim()) return;
        await taskBoardService.addTask(newTask);
        setNewTask({ title: '', description: '', priority: 'medium', column: 'todo' });
        setShowAddModal(false);
        loadTasks();
    };

    const handleDeleteTask = async (taskId) => {
        await taskBoardService.deleteTask(taskId);
        loadTasks();
    };

    const handleDrop = async (taskId, newColumn) => {
        await taskBoardService.moveTask(taskId, newColumn);
        setDraggedTask(null);
        loadTasks();
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-500';
            case 'medium': return 'bg-amber-500';
            case 'low': return 'bg-green-500';
            default: return 'bg-slate-500';
        }
    };

    const TaskCard = ({ task }) => (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            draggable
            onDragStart={() => setDraggedTask(task)}
            onDragEnd={() => setDraggedTask(null)}
            className={`p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 cursor-grab active:cursor-grabbing transition-all group ${draggedTask?.id === task.id ? 'opacity-50' : ''
                }`}
            style={{ borderLeftColor: task.color, borderLeftWidth: '3px' }}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">{task.title}</h4>
                    {task.description && (
                        <p className="text-xs text-white/50 mt-1 line-clamp-2">{task.description}</p>
                    )}
                </div>
                <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded transition-all"
                >
                    <Trash2 size={14} className="text-red-400" />
                </button>
            </div>

            <div className="flex items-center gap-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                {task.dueDate && (
                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                )}
                {task.tags?.length > 0 && (
                    <span className="text-[10px] text-cyan-400 flex items-center gap-1">
                        <Tag size={10} />
                        {task.tags[0]}
                    </span>
                )}
            </div>
        </motion.div>
    );

    const Column = ({ column }) => {
        const columnTasks = tasks.filter(t => t.column === column.id);

        return (
            <div
                className="flex-1 min-w-[200px] max-w-[280px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => draggedTask && handleDrop(draggedTask.id, column.id)}
            >
                <div className={`flex items-center gap-2 mb-3 px-2`}>
                    <span className={`w-2 h-2 rounded-full bg-${column.color}-500`} />
                    <h3 className="text-sm font-medium text-white/80">{column.label}</h3>
                    <span className="text-xs text-white/40 ml-auto">{columnTasks.length}</span>
                </div>

                <div className={`p-2 rounded-2xl bg-white/[0.02] border border-white/5 min-h-[300px] space-y-2 ${draggedTask ? 'border-dashed border-cyan-500/30' : ''
                    }`}>
                    <AnimatePresence>
                        {columnTasks.map(task => (
                            <TaskCard key={task.id} task={task} />
                        ))}
                    </AnimatePresence>

                    {columnTasks.length === 0 && (
                        <div className="h-20 flex items-center justify-center text-white/20 text-xs">
                            Drop tasks here
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-white">Task Board</h2>
                    <p className="text-xs text-white/50">
                        {stats.completionRate}% complete • {stats.done}/{stats.total} tasks done
                    </p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-xl text-sm transition-colors"
                >
                    <Plus size={16} />
                    Add Task
                </motion.button>
            </div>

            {/* Kanban Columns */}
            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-4 min-w-max pb-4">
                    {columns.map(column => (
                        <Column key={column.id} column={column} />
                    ))}
                </div>
            </div>

            {/* Add Task Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md p-6 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl"
                        >
                            <h3 className="text-lg font-semibold text-white mb-4">New Task</h3>

                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Task title..."
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-cyan-500/50 outline-none"
                                    autoFocus
                                />

                                <textarea
                                    placeholder="Description (optional)"
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-cyan-500/50 outline-none resize-none h-20"
                                />

                                <div className="flex gap-3">
                                    <select
                                        value={newTask.priority}
                                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none"
                                    >
                                        <option value="low">🟢 Low</option>
                                        <option value="medium">🟡 Medium</option>
                                        <option value="high">🔴 High</option>
                                    </select>

                                    <select
                                        value={newTask.column}
                                        onChange={(e) => setNewTask({ ...newTask, column: e.target.value })}
                                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none"
                                    >
                                        <option value="backlog">Backlog</option>
                                        <option value="todo">To Do</option>
                                        <option value="inProgress">In Progress</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddTask}
                                    className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-white font-medium transition-colors"
                                >
                                    Create Task
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TaskBoard;
