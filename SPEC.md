# MyTodoist - Specification

## 1. Project Overview
- **Project name**: MyTodoist
- **Type**: Single-page web application
- **Core functionality**: Task management app with projects, tasks, due dates, priorities, and completion tracking
- **Target users**: Anyone needing to organize tasks and to-do lists

## 2. UI/UX Specification

### Layout Structure
- **Sidebar** (240px width): Project navigation, "Today", "Upcoming", "Filters"
- **Main content area**: Task list with header showing project name
- **Header bar**: Search, user avatar, app title

### Responsive Breakpoints
- Desktop: > 900px (sidebar visible)
- Tablet/Mobile: < 900px (sidebar collapsible)

### Visual Design

#### Color Palette
- **Background**: `#1a1a1a` (dark mode)
- **Sidebar**: `#252525`
- **Card/Task**: `#2d2d2d`
- **Primary accent**: `#e44145` (Todoist red)
- **Text primary**: `#ffffff`
- **Text secondary**: `#9ca3af`
- **Priority colors**:
  - P1 (Critical): `#e44145`
  - P2 (High): `#ff9f43`
  - P3 (Medium): `#feca57`
  - P4 (Low): `#576574`
- **Success**: `#10b981`

#### Typography
- **Font family**: "Segoe UI", system-ui, sans-serif
- **Headings**: 18px bold
- **Body**: 14px regular
- **Small**: 12px

#### Spacing
- Base unit: 8px
- Task padding: 12px 16px
- Section gaps: 16px

### Components

#### Sidebar
- Logo/Title at top
- Navigation items: "Today", "Upcoming", "All Tasks"
- Projects list with colored dots
- "Add Project" button at bottom

#### Task Item
- Checkbox (circle) on left
- Task text
- Due date badge (right side)
- Priority indicator (colored dot)
- Hover: show edit/delete icons

#### Task Input
- "Add task" input at top of task list
- Placeholder: "Add a task..."
- Press Enter to add

#### Modals
- Add/Edit Task modal with: title, due date, priority, project selection
- Add/Edit Project modal with: name, color selection

### Animations
- Task completion: strikethrough with fade
- Hover effects: subtle background change
- Modal: fade in/out

## 3. Functionality Specification

### Core Features
1. **Projects**: Create, edit, delete projects with custom colors
2. **Tasks**: Create, edit, delete, complete tasks
3. **Due dates**: Set due dates (today, tomorrow, pick date)
4. **Priorities**: P1, P2, P3, P4
5. **Smart filters**: Today, Upcoming (next 7 days), All tasks
6. **Local storage**: Persist data in browser localStorage

### User Interactions
- Click checkbox to toggle task completion
- Click task to edit
- Click "+" to add new task/project
- Click filter to view different views
- Hover task to see action buttons

### Data Model
```
Project: { id, name, color }
Task: { id, projectId, title, completed, dueDate, priority, createdAt }
```

## 4. Acceptance Criteria
- [ ] Can create and view projects
- [ ] Can add, edit, complete, delete tasks
- [ ] Can set due dates on tasks
- [ ] Can set priority levels
- [ ] Filter views work (Today, Upcoming, All)
- [ ] Data persists after page refresh
- [ ] Responsive design works on mobile
- [ ] Dark theme applied consistently
