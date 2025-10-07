const { query } = require("../config/database");

function normPagination({ limit, offset }, dLimit = 20, max = 50) {
  const l = Math.min(Math.max(parseInt(limit || dLimit, 10) || dLimit, 1), max);
  const o = Math.max(parseInt(offset || 0, 10) || 0, 0);
  return { limit: l, offset: o };
}

async function searchUsers(requesterId, raw, opts = {}) {
  const term = raw.trim();
  if (!term) return [];
  const { limit, offset } = normPagination(opts, 15, 40);
  const res = await query(
    `WITH blk AS (
       SELECT blocked_id AS uid FROM user_blocks WHERE blocker_id=$1
       UNION
       SELECT blocker_id AS uid FROM user_blocks WHERE blocked_id=$1
     ), base AS (
       SELECT id, username, bio, profile_pic, verified_at,
         (CASE
            WHEN username ILIKE $2 || '%' THEN 1
            WHEN username ILIKE '%' || $2 || '%' THEN 2
            ELSE 3
          END) AS match_tier,
         LENGTH(username) AS uname_len
       FROM users
       WHERE deleted_at IS NULL
         AND id NOT IN (SELECT uid FROM blk)
         AND (
           username ILIKE $3
           OR username ILIKE $4
           OR bio ILIKE $5
         )
     )
     SELECT id, username, bio, profile_pic,
       (verified_at IS NOT NULL) AS verified,
       (100 - (match_tier * 10) - GREATEST(uname_len - LENGTH($2),0)) AS match_score
     FROM base
     ORDER BY match_tier ASC, match_score DESC, username ASC
     LIMIT $6 OFFSET $7`,
    [
      requesterId,
      term.toLowerCase(),
      `${term}%`,
      `%${term}%`,
      `%${term}%`,
      limit,
      offset,
    ]
  );
  return res.rows;
}

async function searchPosts(requesterId, raw, opts = {}) {
  const term = raw.trim();
  if (!term) return [];
  const { limit, offset } = normPagination(opts, 20, 60);
  const res = await query(
    `SELECT p.*,
        (CASE
          WHEN p.caption ILIKE $2 || '%' THEN 95
          WHEN p.caption ILIKE '%' || $2 || '%' THEN 85
          ELSE 60
        END + (CASE WHEN $2 = ANY(p.tags) THEN 15 ELSE 0 END)) AS relevance
     FROM posts p
     WHERE p.deleted_at IS NULL AND (
       p.caption ILIKE $3
       OR p.caption ILIKE $4
       OR EXISTS (SELECT 1 FROM unnest(p.tags) t WHERE t ILIKE $4)
     )
     ORDER BY relevance DESC, p.created_at DESC
     LIMIT $5 OFFSET $6`,
    [requesterId, term.toLowerCase(), `${term}%`, `%${term}%`, limit, offset]
  );
  return res.rows;
}

async function searchPostsByTag(requesterId, raw, opts = {}) {
  const tag = raw.trim();
  if (!tag) return [];
  const { limit, offset } = normPagination(opts, 20, 60);
  const res = await query(
    `SELECT p.*,
        (CASE WHEN $2 = ANY(p.tags) THEN 100 ELSE 50 END) AS relevance
     FROM posts p
     WHERE p.deleted_at IS NULL
       AND EXISTS (SELECT 1 FROM unnest(p.tags) t WHERE t ILIKE $3)
     ORDER BY relevance DESC, p.created_at DESC
     LIMIT $4 OFFSET $5`,
    [requesterId, tag.toLowerCase(), `%${tag}%`, limit, offset]
  );
  return res.rows;
}

async function suggest(requesterId, raw, opts = {}) {
  const { limit } = normPagination(opts, 10, 20);
  const term = raw.trim();
  if (!term) {
    const posts = await query(
      `SELECT 'post' AS type, id, caption, emotion, created_at
       FROM posts
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT $1`,
      [Math.ceil(limit / 2)]
    );
    const users = await query(
      `SELECT 'user' AS type, id, username, profile_pic, (verified_at IS NOT NULL) AS verified
       FROM users
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT $1`,
      [Math.floor(limit / 2)]
    );
    return [...users.rows, ...posts.rows];
  }
  if (term.length < 2) {
    const u = await query(
      `SELECT 'user' AS type, id, username, profile_pic,
        (verified_at IS NOT NULL) AS verified
       FROM users
       WHERE deleted_at IS NULL AND username ILIKE $1
       ORDER BY username ASC
       LIMIT $2`,
      [`${term}%`, limit]
    );
    return u.rows;
  }
  const usersTop = await searchUsers(requesterId, term, {
    limit: Math.floor(limit / 2),
    offset: 0,
  });
  const postsTop = await searchPosts(requesterId, term, {
    limit: Math.ceil(limit / 2),
    offset: 0,
  });
  return [
    ...usersTop.map((u) => ({ type: "user", ...u })),
    ...postsTop.map((p) => ({ type: "post", ...p })),
  ];
}

module.exports = {
  searchUsers,
  searchPosts,
  searchPostsByTag,
  suggest,
};
