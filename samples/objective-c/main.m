#import <Foundation/Foundation.h>

// Interfaces, properties, class and instance methods, literals, and blocks.
typedef NS_ENUM(NSUInteger, ThemeMode) {
    ThemeModeOriginal,
    ThemeModeLigatures,
};

@interface Theme : NSObject
@property(nonatomic, copy) NSString *name;
@property(nonatomic, copy) NSString *accent;
- (instancetype)initWithName:(NSString *)name accent:(NSString *)accent;
- (NSString *)labelWithPrefix:(NSString *)prefix;
@end

@implementation Theme
- (instancetype)initWithName:(NSString *)name accent:(NSString *)accent {
    if ((self = [super init])) {
        _name = [name copy];
        _accent = [accent copy];
    }
    return self;
}

- (NSString *)labelWithPrefix:(NSString *)prefix {
    return [NSString stringWithFormat:@"%@: %@ (%@)", prefix, self.name, self.accent];
}
@end

int main(int argc, const char *argv[]) {
    @autoreleasepool {
        Theme *theme = [[Theme alloc] initWithName:@"CodePen Theme Original"
                                            accent:@"#96b38a"];
        NSArray<NSString *> *tokens = @[@"keyword", @"string", @"comment"];
        [tokens enumerateObjectsUsingBlock:^(NSString *token, NSUInteger index, BOOL *stop) {
            NSLog(@"%lu %@ %@", (unsigned long)index, [theme labelWithPrefix:@"theme"], token);
        }];
    }
    return argc > 0 ? EXIT_SUCCESS : EXIT_FAILURE;
}
