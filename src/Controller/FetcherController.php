<?php
declare(strict_types=1);

namespace App\Controller;

use MusicBrainz\Api\Core\Release;
use MusicBrainz\Client;

class FetcherController extends AppController
{
    /**
     * @param $artist
     * @param $album
     */
    public function getMbid($artist, $album)
    {
        $payload = [];
        $releaseApi = $this->getMusicBrainzApi();
        $query = sprintf(
            'artist:%s AND release:%s',
            strtolower($artist),
            strtolower($album)
        );


        https://musicbrainz.org/ws/2/release/?query=artist%3Athe+beatles+AND+release%3Ahard+day%27s+night&limit=100&offset=0



        echo $query . '<br />';
        $result = $releaseApi->search('beatles');
        $isError = is_string($result);
        echo '<hr />';
        echo $result; exit;
        $this->response = $this->response
            ->withStatus($isError ? 400 : 200)
            ->withType('application/json')
            ->withStringBody(json_encode($result));
    }

    /**
     * @return \MusicBrainz\Api\Core\Release
     */
    private function getMusicBrainzApi()
    {
        $client = new Client('VgrFetcher', '1.0.0', 'graham@phantomwatson.com');

        return new Release($client);
    }
}
