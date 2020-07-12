<?php

return [
    'baseUrl' => 'https://danholloran.me',
    'production' => true,
    'filter' => function ($item) {
        return $item->published;
    }
];
