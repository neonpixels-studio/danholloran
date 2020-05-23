<?php

namespace App\Listeners;

use Zttp\ZttpResponse;
use App\Support\RSSItem;
use App\Support\RSSGenerator;
use Illuminate\Support\Collection;

class GenerateYouTube extends RSSGenerator
{
    protected function formatItem(Collection $item, string $group): RSSItem
    {
        parse_str(parse_url($item->get('link'), PHP_URL_QUERY), $queryVars);

        return new RSSItem(
            $item->get('title'),
            $item->get('description'),
            [
                'link' => $item->get('link'),
                'date' => $item->get('pubDate'),
                'guid' => $item->get('guid'),
                'id' => $queryVars['v'],
            ],
            $this->collectionName()
        );
    }

    protected function collectionName(): string
    {
        return 'youtube';
    }

    protected function getServiceUrl(string $group): string
    {
        return 'http://fetchrss.com/rss/5ec916af8a93f8a9418b45685ec927ee8a93f8c67d8b4567.xml';
    }
}
