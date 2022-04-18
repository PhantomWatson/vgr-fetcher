<?php
/**
 * @var \App\View\AppView $this
 */
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>
        <?= $this->fetch('title') ?>
    </title>
    <?= $this->Html->meta('icon') ?>
    <link href="/bootstrap/css/bootstrap.min.css" rel="stylesheet" />
    <link href="/css/styles.css" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css?family=Raleway:400,700" rel="stylesheet">
    <?php /* echo $this->Html->css(['normalize.min', 'milligram.min', 'cake']);*/ ?>
    <script src="/js/vgr-fetcher.js"></script>
    <?= $this->fetch('meta') ?>
    <?= $this->fetch('css') ?>
    <?= $this->fetch('script') ?>
</head>
<body>
    <h1>
        VGR Album Art Fetcher
    </h1>
    <main class="main">
        <div class="container">
            <?= $this->Flash->render() ?>
            <?= $this->fetch('content') ?>
        </div>
    </main>
    <footer>
        <ul>
            <li>
                &copy; <?= date('Y') ?> <a href="https://phantomwatson.com">Phantom Watson</a>
            </li>
            <li>
                <a href="https://github.com/stephan-strate/php-music-brainz-api">
                    stephan-strate/php-music-brainz-api
                </a>
            </li>
            <li>
                <a href="https://github.com/stephan-strate/php-cover-art-archive-api">
                    stephan-strate/php-cover-art-archive-api
                </a>
            </li>
        </ul>

    </footer>
</body>
</html>
