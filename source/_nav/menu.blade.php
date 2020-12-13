<nav class="hidden lg:flex items-center justify-end text-lg">
    <a title="{{ $page->siteName }} Blog" href="/blog"
        class="ml-6 text-gray-900 hover:text-primary-800 {{ $page->isActive('/blog') ? 'active text-primary-800' : '' }}">
        Blog
    </a>
</nav>
