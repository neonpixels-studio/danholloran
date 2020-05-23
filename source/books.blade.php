---
pagination:
    collection: posts
    perPage: 10
---
@extends('_layouts.master')

@push('meta')
    <meta property="og:title" content="{{ $page->title }}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="{{ $page->getUrl() }}" />
    <meta property="og:description" content="{{ $page->description }}" />
@endpush

@section('body')
    <h1>My Books List</h1>

    <h2>Currently Reading</h2>
    @include('_partials.currently-reading')

    <h2>Completed</h2>
    <div class="flex flex-wrap -mx-6">
        @foreach ($books->where('group', 'read') as $book)
        <div class="sm:w-1/4 w-1/2 px-6 mb-4 text-center">
            <a href="{{ $book->link }}" target="_blank" class="w-full">
                <img
                    src="{{ $book->large_image_url }}"
                    alt="{{ $book->title }} cover"
                    class="mb-4 inline-block w-full shadow"
                    loading="lazy"
                >
            </a>
        </div>
        @endforeach
    </div>
@endsection
