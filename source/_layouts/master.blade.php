@php
$full_width = in_array($page->getPath(), ['', '/resume']);
@endphp
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <meta name="description" content="{{ $page->meta_description ?? $page->siteDescription }}">

        {{-- Start Open Graph --}}
        <meta property="og:title" content="{{ $page->title ?  $page->title . ' | ' : '' }}{{ $page->siteName }}"/>
        <meta property="og:type" content="website" />
        <meta property="og:url" content="{{ $page->getUrl() }}"/>
        <meta property="og:description" content="{{ $page->siteDescription }}" />
        @if($page->cover_image)
            <meta property="og:image" content="{{ $page->cover_image }}" />
        @endif
        {{-- End Open Graph --}}

        {{-- Start Twitter Card --}}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content="@dholloran" />
        <meta name="twitter:creator" content="@dholloran" />
        <meta name="twitter:title" content="{{ $page->title ?? $page->siteTitle }}" />
        @if($page->cover_image)
            <meta name="twitter:image" content="{{ $page->cover_image }}" />
        @endif
        <meta name="twitter:description" content="{{ $page->meta_description ?? $page->siteDescription }}" />
        {{-- End Twitter Card --}}

        <title>{{ $page->siteName }}{{ $page->title ? ' | ' . $page->title : '' }}</title>

        <link rel="home" href="{{ $page->baseUrl }}">
        <link rel="icon" href="/favicon.ico">
        <link rel="alternate" type="application/rss+xml" title="DanHolloran" href="https://danholloran.me/feed.xml">

        @stack('meta')

        @if ($page->production)
            <link rel="preconnect" href="https://www.google-analytics.com" crossorigin>
            {{-- Start - Global site tag (gtag.js) - Google Analytics --}}
            <script async src="https://www.googletagmanager.com/gtag/js?id=UA-64998225-1"></script>
            <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'UA-64998225-1');
            </script>
            {{-- End - Global site tag (gtag.js) - Google Analytics --}}
        @endif

        <link rel="preload" href="https://fonts.googleapis.com/css?family=Fira+Code&display=swap" rel="stylesheet" as="style" onload="this.rel='stylesheet'">
        <link rel="stylesheet" href="{{ mix('css/main.css', 'assets/build') }}">
    </head>

    <body>
        <div id="app" class="flex flex-col justify-between min-h-screen bg-topographic leading-normal font-sans antialiased">
            <header class="flex items-center h-24 py-4 print-hidden" role="banner">
                <div class="container flex items-center max-w-8xl mx-auto px-4 lg:px-8">
                    <a href="/" title="{{ $page->siteName }} home" class="inline-flex items-center text-indigo-800 font-semibold hover:text-indigo-700 text-lg md:text-2xl">
                        <span class="sr-only">{{ $page->siteName }}</span>
                        <svg class="w-48 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2147.47 703.27" width="2147.47" height="703.27">
                            <path d="M1354.35 0q39.14 42.63 78.29 85.23 47.4 51.32 95.73 101.76c24.2 25.22 48.36 50.49 73.51 74.78 14.57 14.07 29.13 28.18 45.18 40.65 5.93 4.61 11 5.61 18.18 2 26.22-13.12 52-27.06 77.72-41.06 3.21-1.74 5.06-1.47 7.64.86q32.89 29.79 66 59.37 56 50.3 112.07 100.55c23.87 21.43 47.44 43.2 71.69 64.19 12.9 11.17 26.94 21 40.51 31.44q52.16 40 104.31 80c.83.64 3.22.84 2 3h-2c-11.63-4.32-23.79-6.73-35.73-9.95q-87.7-23.61-175.49-46.87a44.66 44.66 0 01-24.21-15.51c-36.36-43.94-73.41-87.3-110.18-130.89q-31-36.78-62-73.65c-4.35-5.18-4.36-5.25-9.08.24q-44.54 51.82-89 103.7c-5.53 6.45-5.5 6.51-10.71.15q-79-96.48-158-193-50.89-62.08-101.86-124.08c-8.74-10.66-17.64-21.21-26.07-32.11-3.15-4.07-4.75-3.37-7.88-.06-16.92 17.9-34.09 35.56-51.16 53.31q-38.58 40.14-77.13 80.29l-92.37 96.14c-5.91 6.15-5.87 6.15-10.67-.66q-46.76-66.3-93.53-132.59c-.67-.94-1.44-1.81-2.6-3.27L787.34 455.74c-8.42-10.09-16.59-19.83-24.69-29.6q-20.53-24.76-41-49.61c-2.14-2.62-3.17-3-5.86-.17q-43.04 45.55-86.47 90.69-38.64 40.44-77.17 81c-3.18 3.37-4.75 3.16-7.91 0-32.7-32.55-65.77-64.73-98.22-97.51-6.56-6.62-11.58-7.35-20.32-4.11-99.31 36.82-198.84 73-298.3 109.47Q66.92 578.01 6.59 600.31c-2 .75-4 2.09-6.59 1.22 37.75-23.89 75.53-47.38 113.67-70.25 71.54-42.9 144-84.19 218.38-122 40.55-20.61 81.59-40.13 123.8-57.16 3.4-1.37 5.73-1.34 8.88 1.11 26.31 20.48 52.94 40.53 82.59 56.11 1.3.69 2.73 1.15 4 1.88 6.75 3.81 12.67 3 19.26-1.38 44.66-29.35 88.13-60.42 131.73-91.28 82.84-58.65 165.08-118.13 247.25-177.73q36.3-26.32 72.54-52.71c2.11-1.54 3.43-2.37 5.82.48 16.58 19.74 33.6 39.13 51.68 57.52a175.56 175.56 0 0019.63 17.71c3.94 3 7.53 3.72 12.31 1.58 15.3-6.87 29.56-15.56 43.58-24.61 68.16-43.99 133.37-92.14 198.23-140.79z"/>
                            <path d="M260.24 699.37v-161.2c82.94-10.92 112.58 14.56 112.58 77.48s-34.84 94.64-112.58 83.72zm29.38-138.32v114.92c39.52 5.72 53-12.74 53-55.9s-12.96-63.44-53-59.02zM480.46 684.55c-9.88 9.62-23.66 18.2-42.38 18.2-23.14 0-39-12.74-39-33.8 0-26 24.44-46.8 79-44.46-1.56-25-15.86-30.94-71.5-32.76l2.86-24.44c78 1.3 97.5 17.42 97.5 67.86 0 25.22 1 45.76 2.34 63.7l-26.52 1.3c-.22-1.04-1.52-9.36-2.3-15.6zm-1.3-14.3c-.52-7.54-.52-16.12-.78-26.78-40-4.16-50.7 4.42-50.7 18.72 0 11.44 8.58 18.2 21.84 18.2 9.88 0 20.54-3.9 29.64-10.14zM574.84 599.79c.52 24.18 1 58 1 99.58h-29.09c0-58.24-.52-99.06-2.08-128.44l26.78-1.56 1.56 14.82c10.4-9.36 23.66-17.68 41.6-17.68 22.62 0 37.17 13.26 37.17 44.72v88.14h-28.84v-78c0-22.88-8.58-30.16-21.84-30.16-9.88 0-18.2 3.38-26.26 8.58zM907.37 629.43h-46.28v69.94h-30.42v-161.2h30.42v68.38h46.28v-68.38h30.68v161.2h-30.68zM968.21 637.75c0-42.12 28.86-71.76 63.18-71.76 32.5 0 54.86 23.66 54.86 65.78 0 43.16-28.6 71.5-63.18 71.5-31.98 0-54.86-23.66-54.86-65.52zm88.92-.78c0-31.2-12-47.32-30.68-47.32-17.42 0-28.86 14.3-28.86 42.64 0 31.46 12 47.58 30.68 47.58 17.42.04 28.86-14.3 28.86-42.9zM1116.67 699.37v-21.84h40V540.25l-38.74-2.08 2.61-20.54h65.25v159.9h40l-2.34 21.84zM1259.66 699.37v-21.84h40V540.25l-38.74-2.08 2.6-20.54h65.26v159.9h40l-2.34 21.84zM1397.2 637.75c0-42.12 28.86-71.76 63.18-71.76 32.5 0 54.86 23.66 54.86 65.78 0 43.16-28.6 71.5-63.18 71.5-31.98 0-54.86-23.66-54.86-65.52zm88.92-.78c0-31.2-12-47.32-30.68-47.32-17.42 0-28.86 14.3-28.86 42.64 0 31.46 12 47.58 30.68 47.58 17.42.04 28.86-14.3 28.86-42.9zM1544.88 699.37v-21.84h31.46c-.52-35.1-.78-62.14-1.3-85l-30.68-2.08 2.39-20.54h53.55c.27 1.3 1.83 15.86 2.34 22.36 11.7-13.52 30.16-24.18 54.6-27.3l1.3 30.68c-22.36 1.3-40.29 6-54.86 13 .53 19.5.79 41.34 1.31 68.9h39.25l-2.34 21.84zM1767.43 684.55c-9.88 9.62-23.66 18.2-42.38 18.2-23.14 0-39-12.74-39-33.8 0-26 24.44-46.8 79-44.46-1.56-25-15.86-30.94-71.5-32.76l2.86-24.44c78 1.3 97.5 17.42 97.5 67.86 0 25.22 1 45.76 2.34 63.7l-26.52 1.3c-.22-1.04-1.52-9.36-2.3-15.6zm-1.3-14.3c-.52-7.54-.52-16.12-.78-26.78-40-4.16-50.7 4.42-50.7 18.72 0 11.44 8.58 18.2 21.84 18.2 9.88 0 20.54-3.9 29.64-10.14zM1861.81 599.79c.52 24.18 1 58 1 99.58h-29.06c0-58.24-.52-99.06-2.08-128.44l26.78-1.56 1.56 14.82c10.4-9.36 23.66-17.68 41.6-17.68 22.62 0 37.18 13.26 37.18 44.72v88.14h-28.86v-78c0-22.88-8.58-30.16-21.84-30.16-9.9 0-18.22 3.38-26.28 8.58z"/>
                            </svg>



                    </a>
                    <div id="vue-search" class="flex flex-1 justify-end items-center">
                        <search></search>

                        @include('_nav.social')
                        {{-- @include('_nav.menu') --}}

                        {{-- @include('_nav.menu-toggle') --}}
                    </div>
                </div>
            </header>

            {{-- @include('_nav.menu-responsive') --}}
            <main role="main" class="main flex-auto w-full {{ $full_width ? '' : 'container max-w-4xl mx-auto px-6' }} py-16">
                @yield('body')
            </main>

            <footer class="bg-white text-center text-sm mt-12 py-4 print-hidden" role="contentinfo">
                <ul class="flex flex-col md:flex-row justify-center list-reset">
                    <li class="md:mr-2">
                        &copy; Dan Holloran {{ date('Y') }}.
                    </li>

                    <li>
                        Built with <a href="http://jigsaw.tighten.co" title="Jigsaw by Tighten" target="_blank" rel="noopener noreferrer">Jigsaw</a>, <a href="https://vuejs.org/" target="_blank"  rel="noopener noreferrer">Vue.js</a>
                        and <a href="https://tailwindcss.com" title="Tailwind CSS, a utility-first CSS framework" target="_blank" rel="noopener noreferrer">Tailwind CSS</a>.
                    </li>
                </ul>
            </footer>
        </div>

        <script src="{{ mix('js/main.js', 'assets/build') }}"></script>

        @stack('scripts')
    </body>
</html>
