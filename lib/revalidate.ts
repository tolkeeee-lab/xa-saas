import { revalidateTag } from 'next/cache';

export function revalidateUserCache(userId: string, tags: string[]): void {
  tags.forEach((tag) => revalidateTag(`${tag}-${userId}`));
}
