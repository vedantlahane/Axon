## Plan: Frontend File Structure Migration

TL;DR: Migrate the current `frontend/src` structure from legacy monolith files and inconsistent naming into a clean, design-driven architecture that matches the `stitch/` HTML UI reference. Perform the migration incrementally: create new components and hooks first, replace current usage, then delete legacy code only after no imports remain.

**Steps**
1. Audit current active usage.
   - Confirmed `Sidebar.tsx`, `MainPanel.tsx`, and `DatabaseConnectionModal.tsx` are currently unused and safe to remove if they remain unreferenced.
   - Confirmed `ChatDisplay.tsx` and `InputSection.tsx` are only used by `MainPanel.tsx`, which is itself unused.
   - Confirmed `chatApi.ts` remains widely imported by hooks and components, so it must be refactored incrementally rather than deleted.
  - Confirmed `SchemaDiagram.tsx` currently uses `mermaid`; the migration will replace it with an HTML/CSS-only `SchemaViewer`, and `types/mermaid.d.ts` can be deleted.
   - Confirmed `types/speech.d.ts` is still referenced by `InputSection.tsx`, so it must remain until speech-related input code is removed or refactored.

2. Establish the final target file structure.
   - Rename `src/components/Canvas/` to `src/components/canvas/`.
   - Rename canvas subcomponents to consistent shorter names:
     - `SqlResultsView.tsx` -> `SqlResults.tsx`
     - `SqlPendingApprovalPanel.tsx` -> `SqlPending.tsx`
     - `SqlHistoryPanel.tsx` -> `SqlHistory.tsx`
     - `SqlSuggestionsPanel.tsx` -> `SqlSuggestions.tsx`
     - `SchemaDiagram.tsx` -> `SchemaViewer.tsx`
     - `types.ts` -> DELETE and move types into `src/types/database.ts`
   - Keep `CanvasPanel.tsx` under the new lowercase directory.

3. Create new shared UI primitives guided by `frontend/stitch` HTML designs.
   - `src/components/ui/Button.tsx`
   - `src/components/ui/Input.tsx`
   - `src/components/ui/Badge.tsx`
   - `src/components/ui/Avatar.tsx`
   - `src/components/ui/Modal.tsx`
   - `src/components/ui/Dropdown.tsx`
   - `src/components/ui/Tooltip.tsx`
   - `src/components/ui/Skeleton.tsx`
   - `src/components/ui/Toggle.tsx`
   - `src/components/ui/Tabs.tsx`

4. Create new domain-specific component families.
   - `src/components/input/`:
     - `FileUploadArea.tsx`
     - `InputMetadata.tsx`
     - `SlashCommandDropdown.tsx`
   - `src/components/chat/cards/`:
     - `DocumentPreview.tsx`
     - `ChartCard.tsx`
     - `QueryResultsTable.tsx`
     - `ErrorCard.tsx`
     - `RecoveryTip.tsx`
     - `SchemaCard.tsx`
     - `SystemCard.tsx`
     - `SuggestionChips.tsx`
     - `NarrativeBlock.tsx`
     - add `index.ts`
   - `src/components/chat/`:
     - `EmptyState.tsx`
     - `StreamingMessage.tsx`
   - `src/components/library/LibrarySearch.tsx`
   - `src/components/documents/DocumentCard.tsx`
     - `UploadDropzone.tsx`
     - `StorageBar.tsx`
   - `src/components/settings/`:
     - `ProfileSection.tsx`
     - `ModelSelector.tsx`
     - `DatabaseSection.tsx`
     - `AppearanceSection.tsx`
     - `DangerSection.tsx`
   - `src/components/errors/ErrorFallback.tsx`
   - `src/components/skeletons/` split `PageSkeletons.tsx` into:
     - `ChatSkeleton.tsx`
     - `LibrarySkeleton.tsx`
     - `DocumentsSkeleton.tsx`
     - `EditorSkeleton.tsx`
     - `SettingsSkeleton.tsx`

5. Create new hooks and re-export index.
   - `src/hooks/useChat.ts`
   - `src/hooks/useDatabase.ts`
   - `src/hooks/useToast.ts`
   - `src/hooks/useCommandPalette.ts`
   - `src/hooks/useMediaQuery.ts`
   - keep `useConversationManager.ts`, `useDatabaseSettings.ts`, `useKeyboardShortcuts.ts`, `useSqlConsole.ts`, `useAuth.ts`

6. Refactor existing services and types.
   - Keep `src/services/http.ts`, `authService.ts`, `chatService.ts`, `databaseService.ts`, `documentService.ts`, `feedbackService.ts`, `graphService.ts`, `modelService.ts`.
   - Retire `src/services/chatApi.ts` only after migrating all consumers to domain services.
   - Merge `src/utils/sqlUtils.ts` into `src/utils/sql.ts` and delete `sqlUtils.ts`.
   - Move `src/components/Canvas/types.ts` type definitions into `src/types/database.ts`, then delete `Canvas/types.ts`.
   - Delete `src/types/mermaid.d.ts` as soon as `SchemaViewer` is rebuilt using HTML/CSS-only and Mermaid is removed.
   - Delete `src/types/speech.d.ts` after `InputSection.tsx` is refactored and speech support is removed.

7. Incrementally replace current screen wiring.
   - Rewrite `App.tsx` route structure to match the new architecture and navigation patterns; do not preserve the current route layout.
   - Replace `ChatView` page internals to compose the new chat/card/input components instead of the legacy `ChatDisplay`/`InputSection` implementation.
   - Replace `DocumentsView`, `LibraryView`, and `SettingsView` internals incrementally with new subcomponents.
   - Keep `CanvasPanel` and rename its directory; rebuild `SchemaViewer` as HTML/CSS-only and remove Mermaid-specific dependencies.
   - Remove `Sidebar.tsx` and `MainPanel.tsx` once they are no longer referenced.

8. Clean up legacy files after migration.
   - Delete `src/components/layout/MainPanel.tsx` and `Sidebar.tsx` if still unused.
   - Delete `src/components/modals/DatabaseConnectionModal.tsx` if unused.
   - Delete `src/components/chat/ChatDisplay.tsx` and `InputSection.tsx` after replacement.
   - Delete `src/services/chatApi.ts` once all imports are gone.
   - Delete `src/utils/chatMappers.ts` once chat mapping logic is absorbed into `chatService.ts` or a new chat utility module.
   - Delete `src/components/Canvas/types.ts` after type relocation.
   - Delete `src/utils/sqlUtils.ts` after merging.
   - Delete `src/types/speech.d.ts` after speech code is removed.
   - Delete `src/types/mermaid.d.ts` after Mermaid is fully removed and the HTML/CSS `SchemaViewer` is in place.

9. Update documentation and README.
   - Reflect the final `frontend/src` structure with the new lowercase `canvas/` folder.
   - Note the `stitch/` folder HTML pages as the UI design reference.
   - Document the migration status and any remaining legacy compatibility layer.

**Relevant files**
- `frontend/src/App.tsx` — route/layout entrypoint
- `frontend/src/components/layout/AppShell.tsx` — shell wrapper
- `frontend/src/components/Canvas/CanvasPanel.tsx` — active canvas container
- `frontend/src/components/layout/MainPanel.tsx` — unused legacy screen wrapper
- `frontend/src/components/layout/Sidebar.tsx` — unused legacy navigation
- `frontend/src/components/modals/DatabaseConnectionModal.tsx` — unused modal
- `frontend/src/components/chat/ChatDisplay.tsx` — legacy chat renderer
- `frontend/src/components/chat/InputSection.tsx` — legacy chat input
- `frontend/src/services/chatApi.ts` — legacy monolith service
- `frontend/src/utils/sqlUtils.ts` — merge target
- `frontend/src/components/Canvas/types.ts` — move types
- `frontend/src/hooks/useSqlConsole.ts` — currently imports old service and util
- `frontend/stitch/` — new UI design reference

**Verification**
1. Run `npm run lint` and `npm run build` after each major refactor step.
2. Confirm no remaining imports of `chatApi.ts`, `ChatDisplay.tsx`, `InputSection.tsx`, `MainPanel.tsx`, `Sidebar.tsx`, or `DatabaseConnectionModal.tsx` before deleting them.
3. Confirm route/page loads for `/`, `/library`, `/documents`, and `/settings` with new components.
4. Confirm SQL schema and query experience still work after the canvas rename.
5. Use `grep` to ensure `useSqlConsole.ts` and `useConversationManager.ts` no longer keep old `chatApi` references after service migration.

**Decisions**
- Remove Mermaid dependency entirely for the schema viewer and rebuild `SchemaViewer.tsx` using HTML/CSS only.
- Keep `speech.d.ts` until the speech input code is refactored out of `InputSection.tsx`.
- Use HTML pages in `frontend/stitch/` as the UI reference, not as direct component code.

**Further considerations**
1. If the `stitch/` designs include a new top-level navigation pattern, update `TopBar.tsx` and `AppShell.tsx` in the same phase as the chat/page refactor.
2. Decide whether `SchemaViewer.tsx` should be implemented as a responsive HTML/CSS browser that matches the design instead of Mermaid.
3. Rewrite routes explicitly for the new architecture rather than preserving the current route structure while migrating.
