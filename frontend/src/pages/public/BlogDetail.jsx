import React from "react";
import { useParams, Link } from "react-router-dom";
import { Section, Loader, Empty } from "@/components/site/SiteLayout";
import { BlogCard } from "@/components/site/cards";
import { Badge } from "@/components/ui/badge";
import { useGet } from "@/hooks/usePublic";
import { mediaUrl } from "@/lib/api";
import SEO from "@/components/site/SEO";

const FALLBACK = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=70";

export default function BlogDetail() {
  const { slug } = useParams();
  const { data: post, loading, error } = useGet(`/blog/${slug}`, [slug]);
  const { data: all } = useGet("/blog");
  if (loading) return <Loader />;
  if (error || !post) return <Section className="py-20"><Empty title="Article not found" /></Section>;
  const related = (all || []).filter((b) => b.slug !== slug).slice(0, 3);
  return (
    <div>
      <SEO title={post.seo_title || post.title} description={post.seo_description || post.excerpt} canonical={`/blog/${post.slug}`} />
      <Section className="max-w-3xl py-14">
        <Link to="/blog" className="text-sm text-primary hover:underline">← Back to Blog</Link>
        <Badge variant="secondary" className="mt-4">{post.category}</Badge>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">By {post.author} · {(post.created_at || "").slice(0, 10)}</p>
        <div className="mt-8 overflow-hidden rounded-2xl border border-border"><img src={mediaUrl(post.image_url) || FALLBACK} alt={post.title} className="w-full object-cover" /></div>
        <div className="prose mt-8 max-w-none">
          {(post.content || "").split("\n").filter(Boolean).map((p, i) => <p key={i} className="mb-4 leading-relaxed text-foreground/90">{p}</p>)}
        </div>
        {post.tags?.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{post.tags.map((t) => <Badge key={t} variant="outline">#{t}</Badge>)}</div>}
      </Section>
      {related.length > 0 && (
        <div className="bg-secondary/40 py-14">
          <Section>
            <h2 className="font-heading text-2xl font-bold">Related Articles</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">{related.map((b) => <BlogCard key={b.id} b={b} />)}</div>
          </Section>
        </div>
      )}
    </div>
  );
}
