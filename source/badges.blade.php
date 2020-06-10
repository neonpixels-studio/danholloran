@extends('_layouts.master')

@push('meta')
    <meta property="og:title" content="{{ $page->title }}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="{{ $page->getUrl() }}"/>
    <meta property="og:description" content="{{ $page->description }}" />
@endpush

@section('body')
    <h1>Web Development Merit Badges</h1>
    <p class="mb-12">
        Badges originally from <a href="https://css-tricks.com/web-development-merit-badges/">CSS Tricks</a>.
    </p>
    <div class="flex flex-wrap -mx-6">
        @foreach ($badges as $badge)
            <figure class="md:w-1/3 px-6 mb-8 font-bold text-center merit-badge flex items-center flex-col">
                <div
                    class="w-full h-auto mb-4 {{
                        $badge->earned ? '' : 'opacity-75 grayscale'
                    }}"
                >
                    {!! $badge->getContent() !!}
                </div>
                <figcaption>{{ $badge->title }}</figcaption>
            </figure>
        @endforeach
    </div>
@endsection
