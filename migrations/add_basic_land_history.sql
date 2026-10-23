ALTER TABLE mtg_deck_history
  ADD COLUMN action_type TEXT NOT NULL DEFAULT 'card_role',
  ADD COLUMN from_quantity INT,
  ADD COLUMN to_quantity INT;
