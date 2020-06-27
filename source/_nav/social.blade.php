<div>
    {{-- Icons are from https://icongr.am/material --}}
    <ul class="flex items-center">
        <li class="mr-2">
            <a href="{{ $page->gitlab->get('link') }}" title="Gitlab" class="block h-6 text-theme-1-700">
                @include('_partials.icon-gitlab')
                <span class="sr-only">Gitlab</span>
            </a>
        </li>

        <li class="mr-2">
            <a href="{{ $page->github->get('link') }}" title="GitHub" class="block h-6 text-theme-1-700">
                @include('_partials.icon-github')
                <span class="sr-only">GitHub</span>
            </a>
        </li>

        <li class="mr-2">
            <a href="{{ $page->twitter->get('link') }}" title="Twitter" class="block h-6 text-theme-1-700">
                @include('_partials.icon-twitter')
                <span class="sr-only">Twitter</span>
            </a>
        </li>

        <li class="mr-2">
            <a href="{{ $page->linkedIn->get('link') }}" title="LinkedIn" class="block h-6 text-theme-1-700">
                @include('_partials.icon-linkedin')
                <span class="sr-only">LinkedIn</span>
            </a>
        </li>

        <li class="mr-2">
            <a href="{{ $page->youTube->get('link') }}" title="YouTube" class="block h-6 text-theme-1-700">
                @include('_partials.icon-youtube')
                <span class="sr-only">YouTube</span>
            </a>
        </li>

        <li class="mr-2">
            <a href="{{ $page->instagram->get('link') }}" title="Instagram" class="block h-6 text-theme-1-700">
                @include('_partials.icon-instagram')
                <span class="sr-only">Instagram</span>
            </a>
        </li>

        <li>
            <a href="/feed.xml" title="RSS" class="block h-6 text-theme-1-700">
                @include('_partials.icon-rss')
                <span class="sr-only">RSS</span>
            </a>
        </li>
    </ul>
</div>
