## [Blog](/blog)

### PHP foreach by Reference Considered Harmful

Consider the following snippet of code.

```php
<?php

$foo = [1, 2, 3];
foreach($foo as &$bar) {}
foreach($foo as $bar) {}
print_r($foo);
```

What gets printed out?

You might be expecting the result to be:

```
Array
(
	[0] => 1,
	[1] => 2,
	[2] => 3
)
```

Let's run the code and see what we get...

```
Array
(
	[0] => 1,
	[1] => 2,
	[2] => 2
)
```
