@extends('_layouts.master')

@push('meta')
<meta property="og:title" content="{{ $page->title }}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="{{ $page->getUrl() }}" />
<meta property="og:description" content="{{ $page->description }}" />
@endpush

@section('body')
@include('_partials.cover-image', ['page' => $page])

@if($page->getCollection() === 'pages')
<h1 class="mb-8 leading-none">{{ $page->title }}</h1>
@endif

@if($page->getCollection() === 'posts')
<h1 class="mb-2 leading-none">{{ $page->title }}</h1>

<p class="flex items-center text-xl text-gray-700 md:mt-0">
    <img src="{{ $page->authorImageSrcSmall }}" alt="{{ $page->author }} Avatar" class="mr-2 rounded-full" width="36"
        height="36">
    {{ $page->author }} • {{ date('F j, Y', $page->date) }}
</p>
@endif

@if ($page->getCollection() === 'projects')
<h1 class="mb-1 leading-none">{{ $page->title }}</h1>

<div class="mb-4">
    @include('_partials.production-url', [
    'page' => $page,
    ])
</div>
@endif

@include('_partials.categories', [
'page' => $page
])

@component('_partials.alert')
{{ $page->alert_message ?? null }}
@endcomponent

<div class="pb-4 mb-10 border-b border-primary-200 content" v-pre>
    @yield('content')
</div>

<nav class="flex justify-between text-sm md:text-base">
    <div>
        @if ($next = $page->getNext())
        <a href="{{ $next->getUrl() }}" title="Older Post: {{ $next->title }}">
            &LeftArrow; {{ $next->title }}
        </a>
        @endif
    </div>

    <div>
        @if ($previous = $page->getPrevious())
        <a href="{{ $previous->getUrl() }}" title="Newer Post: {{ $previous->title }}">
            {{ $previous->title }} &RightArrow;
        </a>
        @endif
    </div>
</nav>
@endsection
