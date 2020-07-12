---
extends: _layouts.post
section: content
title: Ruby for PHP Developers
categories: []
cover_image: /assets/img/ruby-for-php-developers.jpg
published: false
---
- Inspired by [React for Vue Developers](https://sebastiandedeyne.com/react-for-vue-developers/)
- This post assumes you are comfortable with programming concepts in general (especially with PHP) and is only intended to show some of the syntax differences between the 2 languages.
- The examples below are not the only options I know Ruby has some terser options and I am sure more options since I have only scratched the surface primarily using Ruby with Jekyll.
- Please let me know if anything is incorrect or could be improved.

## Todo

- [ ]  Explanation for anything that is not 1 to 1 or maybe close but not 100% the same
- [x]  All PHP Examples
- [ ]  All Ruby examples
- [ ]  Testing
- [ ]  Debugging
- [ ]  Resources

### Comments

```php
// A Comment
```

```ruby
# A Comment
```

### Filter

```php
// Filter
array_filter(['...'], function ($value) {
	return $value === 'something';
});
```

```ruby
# Filter
array.select {|value| value === 'something' }
# or .filter is an alias for .select
array.filter {|value| value === 'something' }
```

### Map

```php
// Map
array_map(function ($value) {
	return "{$value}...";
}, ['...']);
```

```ruby
# Map
['...'].map{|value| "#{value}..." }
```

## If/else if/else

```php
if ($value === 'something') {
	// do something
} else if ($value === 'something else') {
	// do something else
} else {
	// do the default
}
```

```ruby
if value === 'something'
	  # do something
elsif value === 'something else'
   # do something else
else
   # do the default
end
```

## Switch

```php
switch ($value) {
    case 1:
        // do something for case 1
        break;
    case 2:
        // do something for case 2
        break;
    case 3:
        // do something for case 3
        break;
    default:
        // handle default
}
```

```ruby
case value
when 1
	# do something for case 3
when 2
	# do something for case 2
when 3
	# do something for case 3
else
	# handle default
```

## For

```php
for ($i = 0; $i <= 10; $i++) {
  // do something with $i
}
```

```ruby
for i in 0..10
	# do something with i
end
```

## Foreach

```php
foreach (range(0, 5) as $key => $value) {
	// do something with $key and/or $value
}
```

```ruby
(0..5).each do |value|
	# do something with value
end
```

## While

```php
$i = 0
while ($i <= 10) {
	// do something with $i
	$i++
}
```

```ruby
$i = 0
while $i <= 10  do
	# do something with $i
	$i +=1
end
```

## Variable

```php
$value = 'something'
```

```ruby
value = 'something'
```

## Strings

### Strings - Interpolation

```php
$message = "Hello, {$name}!"
```

```ruby
$message = "Hello, #{name}!"
```

### Strings - Concatenation

```php
$message = 'Hello, ' . $name . '!';
```

```ruby
$message = 'Hello, ' + $name + '!';
```

## No value

```php
null
```

```ruby
nil
```

## Functions

```php
function sumsValues($value1, $value2) {
	return $value1 + $value2;
}
```

```ruby
def sums_values(value1, value2)
  value1 + value2
end
```

### Functions - Typed

```php
function sumsValues(int $value1, int $value2): int {
	return $value1 + $value2;
}
```

```ruby
# Not available
```

### Functions - Implicit returns

```php
// Not available
```

```ruby
# The functions return value will be the result of value1 + value2
def sums_values(value1, value2)
  value1 + value2
end
```

## Arrays

### Arrays - Regular

```php
[
	'value 1 at index 0',
	'value 2 at index 1',
	'value 3 at index 2',
	'value 4 at index 3',
	'value 5 at index 4',
];
```

```ruby
Array[
  'value 1 at index 0',
  'value 2 at index 1',
  'value 3 at index 2',
  'value 4 at index 3',
  'value 5 at index 4',
]
```

### Arrays - Associative

```php
[
	'key1' => 'value 1',
	'key2' => 'value 2',
	'key3' => 'value 3',
	'key4' => 'value 4',
	'key5' => 'value 5',
];
```

```ruby
{
	'key1' => 'value 1',
	'key2' => 'value 2',
	'key3' => 'value 3',
	'key4' => 'value 4',
	'key5' => 'value 5',
};
```

## Generic Object

**Note:** This is not full 1 to 1 but you can accomplish much the same thing with both.

```php
$object1 = new stdClass();
$object1->value1 = 'value 1';
$object1->value2 = 'value 2';
$object1->value3 = 'value 3';

// Anonoymous class
$object2 = new class{};
$object2->value1 = 'value 1';
$object2->value2 = 'value 2';
$object2->value3 = 'value 3';

// Same as new stdClass()
$object3 = (object)[
	'value1' => 'value 1',
	'value1' => 'value 1',
	'value1' => 'value 1',
];

```

```ruby
# somewhat like stdClass()
struct1 = Struct.new(:value1, :value2, :value3)
object1 = struct1.new('value 1', 'value 2', 'value 3')

object2 = OpenStruct.new({
	:value1 => 'value 1',
	:value2 => 'value 2',
	:value3 => 'value 3',
})
```

## Operators

```php
// Ternary (?:, ?=, ??)
// Equal To
// Strict Equal To
// Greater Than
// Greater than or Equal to
// Less Than
// Less than or Equal to
// Other?
```

```ruby

```

# Classes

```php
class MyClass {
	__constructor($value) {
		// optional constructor
	}
}
```

```ruby
class Customer
	def initialize(value)
	  # optional constructor
  end
end
```

### Classes - Inheritance

```php
class MyClass extends BaseClass {
	// Properties or methods
}
```

```ruby
class MyClass < BaseClass {
	# Properties or methods
}
```

### Classes - Trait

```php
// Declaration in MyTrait.php
trait MyTrait {
	// Proprties or methods much like a class
}

// Usage in MyClass.php
class MyClass {
	use MyTrait
}
```

```ruby
# Declaration in MyModule.rb
module MyModule {
	# Proprties or methods much like a class
}

# Usage in MyClass.rb
class MyClass
  include MyModule
end
```

### Classes - Interface

```php
// Declaration in MyInterface.php
interface MyInterface {
	public function sumsValues($value1, $value2);
}

// Usage in MyClass.php
class MyClass implements MyInterface {
	public function sumsValues($value1, $value2) {
		return $value1 + $value2;
	}
}
```

```ruby
# I might be missing something but I am not finding information about interfaces in the language.
# It seems like you can get the idea without the enforcement
```

### Classes - Abstract

```php
// Declaration in MyAbstractClass.php
abstract class MyAbstractClass {
	abstract public function sumsValues($value1, $value2);

	protected function convertValueToInt($value) {
		// Helper method that can used by concrete implementations.
		return $value
	}
}

// Usage in MyClass.php
class MyClass implements MyInterface {
	public function sumsValues($value1, $value2) {
		return $this->convertValueToInt($value1) + $this->convertValueToInt($value2);
	}
}
```

```ruby
# Just like interfaces it seems that abstract classes can be replaced with modules aka traits
```

### Classes - Access Current Instance

```php
class MyClass {
	protected $total = 0;

	public function calculate($value, $increment = true) {
		if ($increment) {
			return $this->total = $this->increment($value);
		}

		return $this->total = $this->decrement($value);
	}

	protected function increment($value) {
		return $this->total + $value;
	}

	protected function decrement($value) {
		return $this->total - $value;
	}
}
```

```ruby

```

### Classes - Access Current Static Instance

```php
class MyClass {
	protected static $total = 0;

	public static function calculate($value, $increment = true) {
		if ($increment) {
			return self::$total = self::increment($value);
		}

		return self::$total = self::decrement($value);
	}

	protected static function increment($value) {
		return self::$total + $value;
	}

	protected static function decrement($value) {
		return self::$total - $value;
	}
}
```

```ruby

```

### Classes - Instance Variables

```php
// not available
```

```ruby

```

### Classes - Properties (Public/Private/Protected/Static)

```php
class MyClass {
	public $publicProperty = 'public value';
  protected $protectedProperty = 'protected value';
  private $privateProperty = 'private value';
  public static $publicStaticProperty = 'public static value';
  protected static $protectedStaticProperty = 'protected static value';
  private static $privateStaticProperty = 'private static value';
}
```

```ruby
class MyClass
	@publicProperty = 'public value';
  @protectedProperty = 'protected value';
  @privateProperty = 'private value';
  @publicStaticProperty = 'public static value';
  @protectedStaticProperty = 'protected static value';
  @privateStaticProperty = 'private static value';
end
```

## Classes - Configurable property

```php
class MyClass {
	public $publicProperty;

	public function __construct($publicProperty) {
		$this->publicProperty = $publicProperty;
	}
}
```

```ruby

```

### Classes - Methods (Public/Private/Protected/Static)

```php
class MyClass {
	public publicSumsValues ($value1, $value2) {
    return $value1 + $value2;
  }

  protected protectedSumsValues ($value1, $value2) {
    return $value1 + $value2;
  }

  private privateSumsValues ($value1, $value2) {
    return $value1 + $value2;
  }

  public static publicStaticSumsValues ($value1, $value2) {
    return $value1 + $value2;
  }

  protected static protectedStaticSumsValues ($value1, $value2) {
    return $value1 + $value2;
  }

  private static privateStaticSumsValues ($value1, $value2) {
    return $value1 + $value2;
  }
}
```

```ruby

```

### Classes - Instance

```php
$value = 'some value';
$myClass = new MyClass($value);
```

```ruby

```

### Classes - Method Usage

```php
$myClass = new MyClass;
$sum = $myClass->sumsValues($value1 = 2, $value2 = 2);
```

```ruby

```

### Classes - Properties Usage

```php
$myClass = new MyClass;
echo $myClass->publicProperty;
```

```ruby

```

### Classes - Check if a method exists

```php
$value1 = 2;
$value2 = 2;
$sum = 0;
$myClass = new MyClass;
if (method_exists($myClass, 'sumsValues')) {
	$sum = $myClass->sumsValues($value1, $value2);
}
```

```ruby

```

### Classes - Static Method Usage

```php
$sum = $myClass::sumsValues($value1 = 2, $value2 = 2);
```

```ruby

```

### Classes - Static Properties Usage

```php
echo $myClass::$publicProperty;
```

```ruby

```

## Name Spacing

### Name Spacing - Classes

```php
// Declaration in App/Support/MyClass.php
namespace App\Support;

class MyClass {}

// Usage in App/AnotherClass.php
namespace App;

use App\Support\MyClass;

class AnotherClass extends MyClass {}
```

```ruby

```

### Name Spacing - Functions

```php
// Declaration in App/Functions/helpers.php
namespace App\Functions;

function sumValues ($value1, $value2) {
	return $value1 + $value2;
}

// Usage elsewhere
App\Function\sumsValues($value1 = 2, $value2 = 2);
```

```ruby

```

## Testing

## Debugging

### Debugging - Output

- `binding.pry`
- `var_dump()`, `print_r()`, `dd()`

### Debugging - Debugger

- xDebug

## Resources

- Laracasts → What in Ruby?
