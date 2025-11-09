-- Add composite index on (user_id, due_date) for optimized due flashcards queries
-- This index significantly improves performance of queries that filter by user_id 
-- and sort/filter by due_date, which is the primary use case for the /api/flashcards/due endpoint

CREATE INDEX IF NOT EXISTS idx_flashcards_user_due_date 
ON public.flashcards (user_id, due_date);

-- Add comment to the index for documentation
COMMENT ON INDEX public.idx_flashcards_user_due_date IS 
'Composite index for efficient due flashcards queries. Supports WHERE user_id = ? AND due_date <= ? ORDER BY due_date';
