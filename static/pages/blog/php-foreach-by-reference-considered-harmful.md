## [Blog](/blog)

### PHP foreach by Reference Considered Harmful

If you've ever worked with PHP, you've seen `foreach` loops.
`foreach` is PHP's standard construct for iterating over arrays, and it is ubiquitous in the language.
But using `foreach` can have some surprising consequences when used with references.

Consider the following apparently ineffectual snippet of code.

```php
<?php

$foo = [1, 2, 3];
foreach($foo as &$bar) {}
foreach($foo as $bar) {}
print_r($foo);
```

A variable `$foo` is declared and initialized to be an array with three elements: 1, 2, and 3, and two `foreach` loops are used to iterate over `$foo`.
This looks simple: the array `$foo` should be unchanged from the time it is initialized to the time it is printed.
As such, you might expect the output to be as follows.

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

Surprisingly, the array has changed so that the element at index `2` now has the same value as the element at index `1`.

#### What's going on under the hood
Changing `print_r` to `var_dump` and running the code again gives us some additional insight into what is going on.

```
array(3) {
  [0]=>
  int(1)
  [1]=>
  int(2)
  [2]=>
  &int(2)
}
```

Notice that the elements at indices `0` and `1` have type `int` whereas the element at index `2` has type `&int`.
The element at index `2` is actually a reference to the element at index `1`.
This is ultimately happening because **PHP is not block scoped**: the `$bar` variable continues to exist beyond each `foreach` block.
In particular, the code could be rewritten equivalently as follows.

```php
<?php

$foo = [1, 2, 3];
$bar = &$foo[0]; // $bar = 1, referencing $foo[0]
$bar = &$foo[1]; // $bar = 2, referencing $foo[1]
$bar = &$foo[2]; // $bar = 3, referencing $foo[2]
$bar = $foo[0];  // $bar = 1, referencing $foo[2]
$bar = $foo[1];  // $bar = 2, referencing $foo[2]
$bar = $foo[2];  // $bar = 2, referencing $foo[2]
print_r($foo);
```

This makes it clearer what is happening. After the first `foreach` loop, `$bar` references `$foo[2]`, and the value of `$foo[2]` is updated throughout the second `foreach` loop.

#### A good solution

The aforementioned behaviour can introduce subtle, hard-to-catch bugs into production code.
There ***are*** ways to systematically protect against such issues.

One way to mitigate risk is to **always unset references after `foreach` loops.**
This simulates the reference being confined to a block scope within the `foreach` loop.

For example:

```php
foreach($foo as &$bar) {
	    $bar = rand();
}
unset($bar);
```

This approach will work, but it requires remembering to unset the reference variable after every `foreach` loop.
This can easily be overlooked, again opening up the possibility for bugs.

#### A better solution

Do not use references in `foreach` loops.

Rather than using references, if you need to update an array within a `foreach` loop, iterate over key and value.

For example, this loop:

```php
foreach($foo as &$bar) {
	    $bar = rand();
}
```

can be rewritten as:

```php
foreach($foo as $key => $bar) {
	    $foo[$key] = rand();
}
```

This solution is convenient because it only requires remembering to avoid `foreach` loops using references by convention.

#### Conclusion
Misuse of references in PHP can introduce tricky bugs.
The language offers alternative constructs to forgo using references in `foreach` loops altogether.
Avoid using references in `foreach` loops to prevent errors.
