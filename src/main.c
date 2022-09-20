#include "wasm4.h"
#include <math.h>
#include <stdlib.h>

#define MAX_PARTICLES 500
#define MAX_STICKS 300
#define ITERATIONS 4

const uint8_t smiley[] = {
    0b11000011,
    0b10000001,
    0b00100100,
    0b00100100,
    0b00000000,
    0b00100100,
    0b10011001,
    0b11000011,
};

struct Particle
{
    double x;
    double y;
    double vx;
    double vy;
    int life;
};

struct Stick
{
    struct Particle *a;
    struct Particle *b;
    double restLength;
    int life;
};

struct Particle particles[MAX_PARTICLES];
struct Stick sticks[MAX_STICKS];

// stupid methods just for adding to arrays
// I'm learning C.
// Probably should track the count, and shift elements when removing.
int add_particle(struct Particle particle)
{
    for (int i = 0; i < MAX_PARTICLES; i++)
    {
        if (particles[i].life <= 0)
        {
            particles[i] = particle;
            return i;
        }
    }
    return -1;
}

int add_stick(struct Stick stick)
{
    for (int i = 0; i < MAX_STICKS; i++)
    {
        if (sticks[i].life <= 0)
        {
            sticks[i] = stick;
            return i;
        }
    }
    return -1;
}

int t = 0;

void update()
{
    t++;

    *DRAW_COLORS = 2;
    text("Hello from C!", 10, 10);

    uint8_t gamepad = *GAMEPAD1;
    if (gamepad & BUTTON_1)
    {
        *DRAW_COLORS = 4;

        struct Particle p = {80, 80, sin(t), cos(t), 100};
        int p_i = add_particle(p);
        struct Stick stick = {&particles[p_i], &particles[p_i - 1], 10, 100};
        add_stick(stick);
    }

    for (int it = 0; it < ITERATIONS; it++)
    {
        for (int i = 0; i < MAX_STICKS; i++)
        {
            struct Stick *s = &sticks[i];
            if (s->life > 0)
            {
                double dx = s->a->x - s->b->x;
                double dy = s->a->y - s->b->y;
                double d = sqrt(dx * dx + dy * dy);
                double delta = s->restLength - d;
                double force = delta * 0.00001;
                s->a->vx += force * dx;
                s->a->vy += force * dy;
                s->b->vx -= force * dx;
                s->b->vy -= force * dy;
            }
        }
    }

    for (int i = 0; i < MAX_STICKS; i++)
    {
        struct Stick *s = &sticks[i];
        if (abs((int32_t)(s->a->x - s->b->x)) > 800 ||
            abs((int32_t)(s->a->y - s->b->y)) > 800 ||
            s->a->life <= 0 ||
            s->a->life <= 0)
        {
            s->life = 0;
        }
        if (s->life > 0)
        {
            // s->life -= 1;
            line((int32_t)s->a->x, (int32_t)s->a->y, (int32_t)s->b->x, (int32_t)s->b->y);
        }
    }

    for (int i = 0; i < MAX_PARTICLES; i++)
    {
        struct Particle *p = &particles[i];
        if (p->life > 0)
        {
            p->x += p->vx;
            p->y += p->vy;
            p->life -= 1;
            blit(smiley, (int32_t)p->x, (int32_t)p->y, 8, 8, BLIT_1BPP);
        }
    }
    text("Press X to spawn", 16, 90);
    text("some particles!", 22, 103);
}
