@extends('_layouts.master')

@php
$width = 1280;
$height = 640;
@endphp

@section('body')
<banner>
    <template slot="logo">
        @include('_partials.logo', ['widthClass' => 'w-full'])
    </template>
</banner>
@endsection
