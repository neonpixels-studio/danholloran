<nav id="js-nav-menu" class="nav-menu hidden lg:hidden">
    <ul class="list-reset my-0">
        <li class="pl-4">
            <a title="{{ $page->siteName }} Blog" href="/blog"
                class="nav-menu-item hover:text-primary-800 {{ $page->isActive('/blog') ? 'active text-indigo' : '' }}">Blog</a>
        </li>
    </ul>
</nav>
