import asyncHandler from '../utils/asyncHandler.js';
import Task from '../models/Task.js';

// Allowed values mirror the Task schema enums — defined once here
// so validation and schema stay in sync without duplicating strings.
const VALID_STATUSES = ['pending', 'in-progress', 'completed'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

// @route   GET /api/tasks
// @desc    Get all tasks belonging to the logged-in user.
//          Supports optional filtering (?status=, ?priority=) and
//          pagination (?page=, ?limit=).
// @access  Private
export const getTasks = asyncHandler(async (req, res) => {
  const { status, priority, page = 1, limit = 10 } = req.query;

  // Fix #8 — validate filter params and return a clear 400 rather than
  // silently returning an empty result set for an invalid enum value.
  if (status && !VALID_STATUSES.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  if (priority && !VALID_PRIORITIES.includes(priority)) {
    res.status(400);
    throw new Error(`Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  const filter = { user: req.user._id };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
  const skip = (pageNum - 1) * limitNum;

  const [tasks, total] = await Promise.all([
    Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Task.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: tasks.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: tasks,
  });
});

// @route   GET /api/tasks/:id
// @desc    Get a single task by ID (only if it belongs to the user)
// @access  Private
export const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  res.status(200).json({ success: true, data: task });
});

// @route   POST /api/tasks
// @desc    Create a new task for the logged-in user
// @access  Private
export const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate } = req.body;

  if (!title) {
    res.status(400);
    throw new Error('Task title is required');
  }

  const task = await Task.create({
    title,
    description,
    status,
    priority,
    dueDate,
    user: req.user._id,
  });

  res.status(201).json({ success: true, data: task });
});

// @route   PUT /api/tasks/:id
// @desc    Update a task (only if it belongs to the user)
// @access  Private
export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const { title, description, status, priority, dueDate } = req.body;

  // Only update fields that were actually provided in the request body
  // so a partial PATCH-style update doesn't wipe out existing data.
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;
  if (priority !== undefined) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = dueDate;

  // .save() re-runs Mongoose schema validation, unlike findByIdAndUpdate
  // which skips validators by default.
  await task.save();

  res.status(200).json({ success: true, data: task });
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task (only if it belongs to the user)
// @access  Private
export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Fix #9 — 204 No Content is the correct REST status for a successful
  // DELETE with no response body to return.
  res.status(204).send();
});
