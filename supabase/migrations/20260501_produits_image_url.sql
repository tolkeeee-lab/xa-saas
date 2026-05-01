-- Migration: Add image_url column to produits table
-- PR feat(stock-v4): images produits

ALTER TABLE produits ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;
