-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT,
    "url" TEXT NOT NULL,
    "last_crawled_at" TEXT,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "fb_post_id" TEXT,
    "author_name" TEXT,
    "content" TEXT,
    "comment_inner_text" TEXT,
    "post_text" TEXT,
    "post_url" TEXT,
    "crawled_at" TEXT NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "fb_comment_id" TEXT NOT NULL,
    "author_name" TEXT,
    "comment_text" TEXT,
    "created_at" TEXT,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_results" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "analysis_text" TEXT,
    "created_at" TEXT,

    CONSTRAINT "analysis_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "groups_userId_url_key" ON "groups"("userId", "url");

-- CreateIndex
CREATE UNIQUE INDEX "comments_fb_comment_id_key" ON "comments"("fb_comment_id");

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
