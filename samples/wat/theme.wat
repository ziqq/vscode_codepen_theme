(module
  ;; Imports, types, named parameters, locals, memory, data, and control flow.
  (type $contrast_type (func (param i32 i32) (result i32)))
  (import "env" "log" (func $log (param i32)))

  (memory (export "memory") 1)
  (data (i32.const 0) "CodePen Theme Original\00")

  (func $absolute (param $value i32) (result i32)
    local.get $value
    i32.const 0
    i32.lt_s
    if (result i32)
      i32.const 0
      local.get $value
      i32.sub
    else
      local.get $value
    end)

  (func $contrast (type $contrast_type) (param $background i32) (param $accent i32) (result i32)
    (local $difference i32)
    local.get $background
    local.get $accent
    i32.sub
    call $absolute
    local.tee $difference
    call $log
    local.get $difference)

  (export "contrast" (func $contrast))
)
