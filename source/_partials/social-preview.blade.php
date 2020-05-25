@if ($item->collectionName === 'twitter')
    <div class="social-preview sp-twitter">
        <div class="mb-auto">
            {!! $item->getContent() !!}
        </div>
        <div class="flex items-center text-twitter flex items-center px-6 py-2 mt-2">
            <a
                href="{{ $page->instagram->get('link') }}"
                class="mr-auto h-8 flex items-center"
            >
                @include('_partials.icon-twitter')
            </a>
            <a href="{{ $page->twitter->get('link') }}">{{ "@{$page->twitter->get('username')}" }}</a>
        </div>
    </div>
@endif

@if ($item->collectionName === 'instagram')
    <div class="social-preview sp-instagram relative">
        {!! $item->getContent() !!}
        <div
            class="absolute px-6 py-2 w-full bg-white bottom-0 left-0 flex items-center text-instagram bg-white text-instagram text-base"
        >
            <a
                href="{{ $page->twitter->get('link') }}"
                class="mr-auto h-8 flex items-center text-instagram"
            >
                @include('_partials.icon-instagram')
            </a>
            <a
                href="{{ $page->instagram->get('link') }}"
                color="text-instagram"
            >
                {{ "@{$page->instagram->get('username')}"}}
            </a>
        </div>
    </div>
@endif

@if ($item->collectionName === 'youtube')
    <div class="social-preview sp-youtube relative">
        <img
            src="https://img.youtube.com/vi/{{  $item->id  }}/0.jpg"
            alt="{{ $item->title }} thumbnail"
            class="object-fit"
        >
        <div
            class="absolute px-6 py-2 w-full bg-white bottom-0 left-0 flex items-center  bg-white flex items-center"
        >
            <a
                href="{{ $page->youTube->get('link') }}"
                class="mr-auto h-8 flex items-center">
                @include('_partials.icon-youtube')
            </a>
            <a
                href="{{ $page->youTube->get('link') }}"
                color="text-youtube"
            >
                {{ "@{$page->youTube->get('username')}"}}
            </a>
        </div>
    </div>
@endif
