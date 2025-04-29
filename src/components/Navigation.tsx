import React from "react";

export default function Navigation() {
  return (
    <nav class="bg-secondary-bg py-4 shadow">
      <div class="container mx-auto flex justify-center space-x-6">
        <a href="/" class="hover:text-primary-accent">Home</a>
        <a href="/about" class="hover:text-primary-accent">About</a>
        <a href="/blog" class="hover:text-primary-accent">Blog</a>
      </div>
    </nav>
  );
}
