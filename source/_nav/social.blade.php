<div>
    {{-- Icons are from https://icongr.am/material --}}
    <ul class="flex items-center">
        @foreach ($page->social as $social)
            <li class="{{ $loop->last ? '' : 'mr-2' }}">
                <a href="{{ $social->get('link') }}" title="{{ $social->get('name') }}" class="block h-6 text-theme-1-700">
                    @php
                    $slug = str_slug($social->get('name'));
                    $template = "_partials.icon-{$slug}";
                    @endphp
                    @include($template)
                    <span class="sr-only">{{ $social->get('name') }}</span>
                </a>
            </li>
        @endforeach
    </ul>
</div>
