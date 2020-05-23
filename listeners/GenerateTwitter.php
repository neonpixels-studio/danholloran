<?php

namespace App\Listeners;

use Zttp\ZttpResponse;
use App\Support\RSSItem;
use App\Support\RSSGenerator;
use Illuminate\Support\Collection;

class GenerateTwitter extends RSSGenerator
{
    protected function groups(): Collection
    {
        return collect([
            'all',
        ]);
    }

    protected function formatItem(Collection $item, string $group): RSSItem
    {
        return new RSSItem(
            $item->get('title'),
            $item->get('description'),
            [
                'link' => $item->get('link'),
                'date' => $item->get('pubDate'),
                'guid' => $item->get('guid'),
            ]
        );
    }

    protected function collectionName(): string
    {
        return 'twitter';
    }

    protected function convertResponseToItems(ZttpResponse $response): Collection
    {
        $xml = $response->body();
        $xml = simplexml_load_string($xml, \SimpleXMLElement::class, LIBXML_NOCDATA)->children()->children();
        $xml = json_decode(json_encode($xml), true);

        return collect($xml)->recursive()->get('item');
    }

    protected function getServiceUrl(string $group): string
    {
        return 'http://fetchrss.com/rss/5ec916af8a93f8a9418b45685ec9169d8a93f853408b4567.xml';
    }

    protected function getCachePrefix(): string
    {
        return 'twitter';
    }
}
