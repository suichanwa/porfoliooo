import { BlogPost } from "../../models/BlogPost";
export default function BlogCard({ post }: { post: BlogPost }) {
  return (
    <div className="p-4 border-b border-base-content/10 cursor-pointer hover:text-primary">
      <div className="flex justify-between">
        <h2 className="font-medium">{post.title}</h2>
        <span className="text-sm text-secondary">{post.date}</span>
      </div>
    </div>
  );
}
